import { EvidenceStatus, type EvidenceCard, type ReportDraft } from "@prisma/client";

import { DEFAULT_REPORT_SYSTEM_PROMPT } from "@/lib/constants";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { retrieveEvidence } from "@/lib/ai/rag";

type GenerateInput = {
  sectionId: string;
  cycleId: string;
  studentId: string;
  generatedById: string;
};

type GeneratedReport = {
  text: string;
  citations: Array<{
    sentenceIndex: number;
    evidenceCardId: string;
    snippet: string;
    relevanceScore: number;
  }>;
};

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function fallbackDraft(studentName: string, cards: EvidenceCard[]): GeneratedReport {
  const top = cards.slice(0, 3);

  const sentences = top.map((card) => {
    const reason = card.aiSummary.length > 140 ? `${card.aiSummary.slice(0, 137)}...` : card.aiSummary;
    return `${studentName} ${reason.charAt(0).toLowerCase()}${reason.slice(1)}.`;
  });

  const text =
    sentences.length > 0
      ? sentences.join(" ")
      : `${studentName} has limited approved evidence this period; add more verified observations before finalizing feedback.`;

  return {
    text,
    citations: top.map((card, index) => ({
      sentenceIndex: index,
      evidenceCardId: card.id,
      snippet: card.evidenceText,
      relevanceScore: 0.8,
    })),
  };
}

async function llmDraft(studentName: string, cards: EvidenceCard[]): Promise<GeneratedReport | null> {
  if (!env.LLM_API_KEY) {
    return null;
  }

  const baseUrl = env.LLM_BASE_URL ?? "https://api.openai.com";
  const evidenceContext = cards
    .slice(0, 8)
    .map((card, index) => `${index + 1}. [${card.id}] ${card.aiSummary} | Evidence: ${card.evidenceText}`)
    .join("\n");

  const prompt = [
    `Student: ${studentName}`,
    "Write 3 to 4 concise sentences of narrative feedback based only on evidence.",
    "Do not invent facts. Do not diagnose. Keep tone professional and specific.",
    "Return strict JSON with shape:",
    '{"text":"...","citation_map":[{"sentence_index":0,"evidence_card_id":"..."}] }',
    "Evidence:",
    evidenceContext,
  ].join("\n");

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: DEFAULT_REPORT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      text?: string;
      citation_map?: Array<{ sentence_index?: number; evidence_card_id?: string }>;
    };

    if (!parsed.text) {
      return null;
    }

    const citations = (parsed.citation_map ?? [])
      .map((item) => {
        const card = cards.find((c) => c.id === item.evidence_card_id);
        if (!card || item.sentence_index === undefined) {
          return null;
        }
        return {
          sentenceIndex: item.sentence_index,
          evidenceCardId: card.id,
          snippet: card.evidenceText,
          relevanceScore: 0.88,
        };
      })
      .filter((value): value is NonNullable<typeof value> => Boolean(value));

    return {
      text: parsed.text,
      citations,
    };
  } catch {
    return null;
  }
}

export async function generateReportDraft(input: GenerateInput): Promise<ReportDraft> {
  const [cycle, student] = await Promise.all([
    prisma.reportCycle.findUniqueOrThrow({
      where: { id: input.cycleId },
    }),
    prisma.student.findUniqueOrThrow({
      where: { id: input.studentId },
    }),
  ]);

  const ragCandidates = await retrieveEvidence(
    `Generate report feedback for ${student.fullName}`,
    {
      sectionId: input.sectionId,
      studentId: input.studentId,
      from: cycle.periodStart,
      to: cycle.periodEnd,
    },
    8,
  );

  const cards = await prisma.evidenceCard.findMany({
    where: {
      id: {
        in:
          ragCandidates.length > 0
            ? ragCandidates.map((candidate) => candidate.evidenceCardId)
            : undefined,
      },
      sectionId: input.sectionId,
      studentId: input.studentId,
      status: EvidenceStatus.APPROVED,
      observedAt: {
        gte: cycle.periodStart,
        lte: cycle.periodEnd,
      },
    },
    orderBy: {
      observedAt: "desc",
    },
    take: 8,
  });

  if (cards.length === 0) {
    throw new Error("No approved evidence available for this student in the selected report cycle.");
  }

  const llmResult = await llmDraft(student.fullName, cards);
  const generated = llmResult ?? fallbackDraft(student.fullName, cards);

  const sentences = splitSentences(generated.text);
  const citationRows =
    generated.citations.length > 0
      ? generated.citations
      : cards.slice(0, Math.max(1, Math.min(3, sentences.length))).map((card, index) => ({
          sentenceIndex: index,
          evidenceCardId: card.id,
          snippet: card.evidenceText,
          relevanceScore: 0.8,
        }));

  const draft = await prisma.reportDraft.upsert({
    where: {
      cycleId_studentId: {
        cycleId: input.cycleId,
        studentId: input.studentId,
      },
    },
    update: {
      draftText: generated.text,
      modelName: env.LLM_MODEL,
      generatedById: input.generatedById,
      citations: {
        deleteMany: {},
        create: citationRows,
      },
    },
    create: {
      cycleId: input.cycleId,
      studentId: input.studentId,
      generatedById: input.generatedById,
      modelName: env.LLM_MODEL,
      draftText: generated.text,
      citations: {
        create: citationRows,
      },
    },
    include: {
      citations: true,
    },
  });

  return draft;
}
