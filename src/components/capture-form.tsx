"use client";

import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type SectionOption = {
  id: string;
  label: string;
};

type CaptureFormProps = {
  sections: SectionOption[];
};

const defaultVoicePrompt = "Tap the microphone to start recording.";

function stopMediaStream(stream: MediaStream | null) {
  if (!stream) {
    return;
  }
  stream.getTracks().forEach((track) => track.stop());
}

export function CaptureForm({ sections }: CaptureFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; message: string }>({
    type: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [voicePrompt, setVoicePrompt] = useState(defaultVoicePrompt);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const defaultSectionId = sections[0]?.id ?? "";

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      stopMediaStream(mediaStreamRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus({ type: "error", message: "Microphone recording is not supported in this browser." });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const supportsWebm = MediaRecorder.isTypeSupported("audio/webm");
      const recorder = supportsWebm ? new MediaRecorder(stream, { mimeType: "audio/webm" }) : new MediaRecorder(stream);

      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blobType = recorder.mimeType || "audio/webm";
        const recordedBlob = new Blob(audioChunksRef.current, { type: blobType });

        stopMediaStream(mediaStreamRef.current);
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;

        if (recordedBlob.size === 0) {
          setRecordedAudio(null);
          setVoicePrompt("Recording stopped. No audio was captured.");
          return;
        }

        const extension = blobType.includes("wav") ? "wav" : blobType.includes("ogg") ? "ogg" : "webm";
        const capturedFile = new File([recordedBlob], `voice-capture-${Date.now()}.${extension}`, { type: blobType });

        setRecordedAudio(capturedFile);
        setVoicePrompt("Recording stopped. Click the microphone to record again.");
      };

      mediaRecorderRef.current = recorder;
      setRecordedAudio(null);

      if (uploadInputRef.current) {
        uploadInputRef.current.value = "";
      }

      setStatus({ type: "idle", message: "" });
      setVoicePrompt("Recording in progress. Click the red microphone to stop.");
      recorder.start();
      setIsRecording(true);
    } catch {
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
      setStatus({ type: "error", message: "Microphone access was blocked. Please allow microphone access and try again." });
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return;
    }

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    void startRecording();
  };

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const uploadedSource = formData.get("sourceFile");

        formData.delete("sourceFile");

        if (recordedAudio) {
          formData.set("audio", recordedAudio);
        } else if (uploadedSource instanceof File && uploadedSource.size > 0) {
          formData.set("audio", uploadedSource);
        }

        startTransition(async () => {
          setStatus({ type: "idle", message: "" });
          const response = await fetch("/api/capture", {
            method: "POST",
            body: formData,
          });
          const data = (await response.json()) as { error?: string; evidenceCount?: number; provider?: string };
          if (!response.ok) {
            setStatus({ type: "error", message: data.error ?? "Capture failed." });
            return;
          }

          setStatus({
            type: "success",
            message: `Transcribed and processed ${data.evidenceCount ?? 0} evidence card(s) using ${data.provider ?? "pipeline"}.`,
          });

          form.reset();
          setRecordedAudio(null);
          setVoicePrompt(defaultVoicePrompt);

          if (uploadInputRef.current) {
            uploadInputRef.current.value = "";
          }

          router.push("/evidence");
          router.refresh();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="sectionId" className="text-sm font-semibold text-[var(--text-main)]">
            Section
          </label>
          <select
            id="sectionId"
            name="sectionId"
            defaultValue={defaultSectionId}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm"
            required
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="title" className="text-sm font-semibold text-[var(--text-main)]">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue="Quick Observation Session"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm"
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="noteText" className="text-sm font-semibold text-[var(--text-main)]">
          Note
        </label>
        <textarea
          id="noteText"
          name="noteText"
          rows={7}
          placeholder="Example: Ava challenged the framing of distributive justice and referenced chapter 4."
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-main)]">Capture Voice</p>
              <p className="mt-1 text-xs text-[var(--text-subtle)]">Use your microphone to record a quick observation.</p>
            </div>

            <button
              type="button"
              onClick={toggleRecording}
              aria-pressed={isRecording}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                isRecording
                  ? "border-rose-400/70 bg-rose-500/20 text-rose-300 shadow-[0_0_0_5px_rgba(244,63,94,0.16)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-white/90 hover:bg-[var(--surface-muted)]"
              }`}
            >
              <Mic className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <p className={`mt-3 text-xs ${isRecording ? "text-rose-200" : "text-[var(--text-subtle)]"}`}>{voicePrompt}</p>

          {recordedAudio ? <p className="mt-2 text-xs text-emerald-200">Voice clip saved and ready to send.</p> : null}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <div className="grid gap-2">
            <label htmlFor="sourceFile" className="text-sm font-semibold text-[var(--text-main)]">
              Upload File (optional)
            </label>
            <p className="text-xs text-[var(--text-subtle)]">Upload an audio file or document as a separate source.</p>
            <input
              ref={uploadInputRef}
              id="sourceFile"
              name="sourceFile"
              type="file"
              accept="audio/*,.txt,.md,.csv,.doc,.docx,.pdf"
              className="sr-only"
              onChange={() => {
                setRecordedAudio(null);
                if (isRecording) {
                  stopRecording();
                }
                setVoicePrompt(defaultVoicePrompt);
              }}
            />
            <label
              htmlFor="sourceFile"
              className="inline-flex w-fit cursor-pointer items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--surface-muted)]"
            >
              Choose file
            </label>
          </div>
        </section>
      </div>

      <input type="hidden" name="startedAt" value={new Date().toISOString()} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isRecording}
          className="btn-primary inline-flex w-fit items-center rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRecording ? "Stop recording to submit" : isPending ? "Sending to AI..." : "Transcribe & Send to AI"}
        </button>
      </div>

      {status.message ? (
        <p className={status.type === "error" ? "text-sm text-rose-200" : "text-sm text-emerald-200"}>{status.message}</p>
      ) : null}
    </form>
  );
}
