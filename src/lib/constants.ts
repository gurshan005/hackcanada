export const MAX_CAPTURE_NOTE_CHARS = 8000;

export const OBSERVATION_TYPE_LABELS: Record<string, string> = {
  PARTICIPATION: "Participation",
  REASONING: "Reasoning",
  COLLABORATION: "Collaboration",
  PREPAREDNESS: "Preparedness",
  ASSIGNMENT_HABIT: "Assignment Habit",
};

export const EVIDENCE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const DEFAULT_REPORT_SYSTEM_PROMPT =
  "You are an education assistant. Generate concise, neutral, evidence-backed feedback. Do not diagnose students. Do not assign punitive labels. Every claim must map to provided citations.";
