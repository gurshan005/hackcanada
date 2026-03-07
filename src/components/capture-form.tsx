"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type SectionOption = {
  id: string;
  label: string;
};

type CaptureFormProps = {
  sections: SectionOption[];
};

export function CaptureForm({ sections }: CaptureFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: "idle" | "error" | "success"; message: string }>({
    type: "idle",
    message: "",
  });
  const [isPending, startTransition] = useTransition();

  const defaultSectionId = sections[0]?.id ?? "";

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);

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
            message: `Processed ${data.evidenceCount ?? 0} evidence card(s) using ${data.provider ?? "pipeline"}.`,
          });
          form.reset();
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

      <div className="grid gap-2">
        <label htmlFor="audio" className="text-sm font-semibold text-[var(--text-main)]">
          Audio (optional)
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-ghost rounded-full px-4 py-2 text-sm font-semibold">
            Capture Voice
          </button>
          <p className="text-xs text-[var(--text-subtle)]">Mic capture coming next.</p>
        </div>
        <input
          id="audio"
          name="audio"
          type="file"
          accept="audio/*"
          className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm"
        />
      </div>

      <input type="hidden" name="startedAt" value={new Date().toISOString()} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary inline-flex w-fit items-center rounded-full px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Processing..." : "Capture"}
        </button>
      </div>

      {status.message ? (
        <p className={status.type === "error" ? "text-sm text-rose-200" : "text-sm text-emerald-200"}>{status.message}</p>
      ) : null}
    </form>
  );
}
