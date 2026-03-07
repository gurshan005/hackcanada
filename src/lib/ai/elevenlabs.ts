import { env } from "@/lib/env";

export type SegmentTranscript = {
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  speakerLabel?: string;
};

export type StructuredTranscript = {
  provider: string;
  text: string;
  confidence: number;
  segments: SegmentTranscript[];
};

export function transcriptFromText(noteText: string): StructuredTranscript {
  const normalized = noteText.trim();
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const avgDurationMs = 6000;
  const segments = sentences.map((sentence, index) => ({
    text: sentence,
    startMs: index * avgDurationMs,
    endMs: (index + 1) * avgDurationMs,
    confidence: 0.96,
    speakerLabel: "Teacher Note",
  }));

  return {
    provider: "text-fallback",
    text: normalized,
    confidence: 0.96,
    segments,
  };
}

export async function transcribeWithElevenLabs(audioFile: File): Promise<StructuredTranscript> {
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const form = new FormData();
  form.append("file", audioFile);
  form.append("model_id", env.ELEVENLABS_STT_MODEL);
  form.append("diarize", "true");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": env.ELEVENLABS_API_KEY,
    },
    body: form,
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`ElevenLabs transcription failed: ${response.status} ${reason}`);
  }

  const payload = (await response.json()) as {
    text?: string;
    language_code?: string;
    words?: Array<{
      text?: string;
      start?: number;
      end?: number;
      speaker_id?: string;
      confidence?: number;
    }>;
  };

  const text = (payload.text ?? "").trim();
  const words = payload.words ?? [];

  if (!text) {
    return transcriptFromText("Transcription returned no text.");
  }

  const segments: SegmentTranscript[] = [];
  if (words.length > 0) {
    const bucketSize = 20;
    for (let i = 0; i < words.length; i += bucketSize) {
      const bucket = words.slice(i, i + bucketSize);
      const segmentText = bucket.map((word) => word.text ?? "").join(" ").trim();
      if (!segmentText) {
        continue;
      }
      const first = bucket[0];
      const last = bucket[bucket.length - 1];
      const avgConfidence =
        bucket.reduce((acc, word) => acc + (word.confidence ?? 0.9), 0) / bucket.length;

      segments.push({
        text: segmentText,
        startMs: Math.round((first?.start ?? 0) * 1000),
        endMs: Math.round((last?.end ?? (first?.start ?? 0) + 3) * 1000),
        confidence: Number(avgConfidence.toFixed(4)),
        speakerLabel: first?.speaker_id,
      });
    }
  }

  const fallback = transcriptFromText(text);
  return {
    provider: "elevenlabs",
    text,
    confidence: segments.length > 0 ? 0.92 : fallback.confidence,
    segments: segments.length > 0 ? segments : fallback.segments,
  };
}
