import { ObservationType, type Student, type TranscriptSegment } from "@prisma/client";

import type { ExtractedEvidence } from "@/lib/types";

type ExtractorInput = {
  segments: TranscriptSegment[];
  students: Student[];
  sessionStartedAt: Date;
};

const observationRules: Array<{ type: ObservationType; patterns: RegExp[] }> = [
  {
    type: ObservationType.REASONING,
    patterns: [/because/i, /therefore/i, /argue/i, /claim/i, /reason/i],
  },
  {
    type: ObservationType.COLLABORATION,
    patterns: [/peer/i, /build on/i, /responded to/i, /follow-up/i, /dialogue/i],
  },
  {
    type: ObservationType.PREPAREDNESS,
    patterns: [/reading/i, /chapter/i, /prepared/i, /citation/i, /source/i],
  },
  {
    type: ObservationType.ASSIGNMENT_HABIT,
    patterns: [/submission/i, /assignment/i, /deadline/i, /draft/i],
  },
];

function inferObservationType(text: string): ObservationType {
  for (const rule of observationRules) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return rule.type;
    }
  }
  return ObservationType.PARTICIPATION;
}

function matchStudent(text: string, students: Student[]): { id: string; name: string } | null {
  const lower = text.toLowerCase();

  for (const student of students) {
    const full = student.fullName.toLowerCase();
    const first = full.split(" ")[0];
    if (lower.includes(full) || (first && lower.includes(first))) {
      return { id: student.id, name: student.fullName };
    }
  }

  return null;
}

function summarizeEvidence(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= 180) {
    return compact;
  }
  return `${compact.slice(0, 177)}...`;
}

export function extractEvidenceCards(input: ExtractorInput): ExtractedEvidence[] {
  const { segments, students, sessionStartedAt } = input;

  return segments
    .filter((segment) => segment.text.trim().length >= 10)
    .map((segment) => {
      const matched = matchStudent(segment.text, students);
      const observedAt = new Date(sessionStartedAt.getTime() + segment.startMs);
      const inferredType = inferObservationType(segment.text);
      const confidenceBase = segment.confidence ?? 0.85;
      const confidence = matched ? Math.min(0.98, confidenceBase + 0.04) : confidenceBase;

      return {
        studentId: matched?.id ?? null,
        studentName: matched?.name ?? null,
        sourceSegmentId: segment.id,
        observationType: inferredType,
        evidenceText: segment.text,
        aiSummary: summarizeEvidence(segment.text),
        confidence: Number(confidence.toFixed(4)),
        observedAt,
      } satisfies ExtractedEvidence;
    });
}
