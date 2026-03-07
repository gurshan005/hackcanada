import type { ObservationType } from "@prisma/client";

export type ExtractedEvidence = {
  studentId: string | null;
  studentName: string | null;
  sourceSegmentId: string;
  observationType: ObservationType;
  evidenceText: string;
  aiSummary: string;
  confidence: number;
  observedAt: Date;
};

export type CitationCandidate = {
  evidenceCardId: string;
  snippet: string;
  relevanceScore: number;
};
