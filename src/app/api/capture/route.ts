import { ArtifactType, TranscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { MAX_CAPTURE_NOTE_CHARS } from "@/lib/constants";
import { extractEvidenceCards } from "@/lib/ai/extractor";
import { transcriptFromText, transcribeWithElevenLabs } from "@/lib/ai/elevenlabs";
import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  const user = await getDemoUser();

  const contentType = request.headers.get("content-type") ?? "";
  let sectionId = "";
  let title = "";
  let noteText = "";
  let startedAt = new Date();
  let audioFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    sectionId = String(form.get("sectionId") ?? "").trim();
    title = String(form.get("title") ?? "Quick Observation Session").trim();
    noteText = String(form.get("noteText") ?? "").trim();
    const startedAtRaw = String(form.get("startedAt") ?? "").trim();
    if (startedAtRaw) {
      const parsedDate = new Date(startedAtRaw);
      if (!Number.isNaN(parsedDate.getTime())) {
        startedAt = parsedDate;
      }
    }

    const file = form.get("audio");
    if (file instanceof File && file.size > 0) {
      audioFile = file;
    }
  } else {
    const body = (await request.json()) as {
      sectionId?: string;
      title?: string;
      noteText?: string;
      startedAt?: string;
    };
    sectionId = body.sectionId?.trim() ?? "";
    title = body.title?.trim() || "Quick Observation Session";
    noteText = body.noteText?.trim() ?? "";
    if (body.startedAt) {
      const parsedDate = new Date(body.startedAt);
      if (!Number.isNaN(parsedDate.getTime())) {
        startedAt = parsedDate;
      }
    }
  }

  if (!sectionId) {
    return NextResponse.json({ error: "sectionId is required" }, { status: 400 });
  }

  if (!audioFile && !noteText) {
    return NextResponse.json(
      { error: "Provide either noteText or an audio file." },
      { status: 400 },
    );
  }

  if (noteText.length > MAX_CAPTURE_NOTE_CHARS) {
    return NextResponse.json(
      { error: `noteText exceeds ${MAX_CAPTURE_NOTE_CHARS} characters.` },
      { status: 400 },
    );
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    return NextResponse.json({ error: "Section not found." }, { status: 404 });
  }

  const session = await prisma.classSession.create({
    data: {
      sectionId,
      title,
      startedAt,
      createdById: user.id,
    },
  });

  const artifact = await prisma.artifact.create({
    data: {
      sectionId,
      sessionId: session.id,
      createdById: user.id,
      type: audioFile ? ArtifactType.AUDIO_NOTE : ArtifactType.TEXT_NOTE,
      storageUri: audioFile ? `upload://${audioFile.name}` : `note://${session.id}`,
      rawText: noteText || null,
      durationSeconds: null,
    },
  });

  const transcription = await prisma.transcription.create({
    data: {
      artifactId: artifact.id,
      provider: audioFile ? "elevenlabs" : "text-fallback",
      status: TranscriptionStatus.PROCESSING,
    },
  });

  try {
    const transcript = audioFile
      ? await transcribeWithElevenLabs(audioFile)
      : transcriptFromText(noteText);

    const updatedTranscription = await prisma.transcription.update({
      where: { id: transcription.id },
      data: {
        status: TranscriptionStatus.COMPLETED,
        provider: transcript.provider,
        fullText: transcript.text,
        confidence: transcript.confidence,
      },
    });

    const createdSegments = await prisma.$transaction(
      transcript.segments.map((segment, index) =>
        prisma.transcriptSegment.create({
          data: {
            transcriptionId: updatedTranscription.id,
            seqNo: index + 1,
            speakerLabel: segment.speakerLabel,
            startMs: segment.startMs,
            endMs: segment.endMs,
            text: segment.text,
            confidence: segment.confidence,
          },
        }),
      ),
    );

    const students = await prisma.enrollment.findMany({
      where: { sectionId },
      include: { student: true },
    });

    const extractedCards = extractEvidenceCards({
      segments: createdSegments,
      students: students.map((enrollment) => enrollment.student),
      sessionStartedAt: session.startedAt,
    });

    const evidenceCards =
      extractedCards.length > 0
        ? await prisma.$transaction(
            extractedCards.map((card) =>
              prisma.evidenceCard.create({
                data: {
                  sectionId,
                  sessionId: session.id,
                  studentId: card.studentId,
                  sourceSegmentId: card.sourceSegmentId,
                  observationType: card.observationType,
                  evidenceText: card.evidenceText,
                  aiSummary: card.aiSummary,
                  observedAt: card.observedAt,
                  confidence: card.confidence,
                  createdById: user.id,
                },
              }),
            ),
          )
        : [];

    await prisma.auditEvent.create({
      data: {
        institutionId: user.institutionId,
        actorUserId: user.id,
        action: "CAPTURE_CREATED",
        entityType: "CLASS_SESSION",
        entityId: session.id,
        afterState: {
          artifactId: artifact.id,
          transcriptionId: updatedTranscription.id,
          evidenceCount: evidenceCards.length,
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      transcriptionId: updatedTranscription.id,
      evidenceCount: evidenceCards.length,
      provider: transcript.provider,
    });
  } catch (error) {
    await prisma.transcription.update({
      where: { id: transcription.id },
      data: {
        status: TranscriptionStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Unknown transcription error",
      },
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Capture failed while processing transcription/extraction",
      },
      { status: 500 },
    );
  }
}
