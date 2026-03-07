"use client";

import type { ReportCitation, ReportDraft } from "@prisma/client";
import { useMemo, useState, useTransition } from "react";

type SectionOption = {
  id: string;
  label: string;
};

type CycleOption = {
  id: string;
  name: string;
  sectionId: string;
};

type StudentOption = {
  id: string;
  fullName: string;
  sectionId: string;
};

type DraftWithCitations = ReportDraft & {
  citations: Array<ReportCitation & { evidenceCard: { aiSummary: string; evidenceText: string } }>;
};

type Props = {
  sections: SectionOption[];
  cycles: CycleOption[];
  students: StudentOption[];
};

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function ReportStudio({ sections, cycles, students }: Props) {
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id ?? "");
  const [selectedCycleId, setSelectedCycleId] = useState(cycles[0]?.id ?? "");
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");
  const [draft, setDraft] = useState<DraftWithCitations | null>(null);
  const [editableText, setEditableText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const visibleCycles = cycles.filter((cycle) => cycle.sectionId === selectedSectionId);
  const visibleStudents = students.filter((student) => student.sectionId === selectedSectionId);

  const selectedCycleValue = visibleCycles.find((cycle) => cycle.id === selectedCycleId)
    ? selectedCycleId
    : visibleCycles[0]?.id ?? "";
  const selectedStudentValue = visibleStudents.find((student) => student.id === selectedStudentId)
    ? selectedStudentId
    : visibleStudents[0]?.id ?? "";

  const sentenceCount = useMemo(() => splitSentences(editableText).length, [editableText]);
  const citedSentenceCount = useMemo(
    () => new Set((draft?.citations ?? []).map((citation) => citation.sentenceIndex)).size,
    [draft],
  );
  const citationCoverage = sentenceCount > 0 ? Math.min(100, Math.round((citedSentenceCount / sentenceCount) * 100)) : 0;

  const generate = () => {
    startTransition(async () => {
      setStatusMessage("");
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: selectedSectionId,
          cycleId: selectedCycleValue,
          studentId: selectedStudentValue,
        }),
      });

      const data = (await response.json()) as { error?: string; draft?: DraftWithCitations };
      if (!response.ok || !data.draft) {
        setStatusMessage(data.error ?? "Could not generate draft.");
        return;
      }

      setDraft(data.draft);
      setEditableText(data.draft.finalText ?? data.draft.draftText);
      setStatusMessage("Draft ready.");
    });
  };

  const finalize = () => {
    if (!draft) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/reports/${draft.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          finalText: editableText,
          status: "FINALIZED",
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatusMessage(data.error ?? "Could not finalize draft.");
        return;
      }
      setStatusMessage("Draft finalized.");
    });
  };

  const canFinalize = Boolean(draft) && editableText.trim().length >= 20;

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <aside className="grid h-fit gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-lg font-semibold">Inputs</h2>

        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Section</label>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
            value={selectedSectionId}
            onChange={(event) => {
              const nextSection = event.target.value;
              setSelectedSectionId(nextSection);
              const nextCycle = cycles.find((cycle) => cycle.sectionId === nextSection)?.id ?? "";
              const nextStudent = students.find((student) => student.sectionId === nextSection)?.id ?? "";
              setSelectedCycleId(nextCycle);
              setSelectedStudentId(nextStudent);
              setDraft(null);
              setEditableText("");
            }}
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Cycle</label>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
            value={selectedCycleValue}
            onChange={(event) => setSelectedCycleId(event.target.value)}
          >
            {visibleCycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Student</label>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
            value={selectedStudentValue}
            onChange={(event) => setSelectedStudentId(event.target.value)}
          >
            {visibleStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={isPending || !selectedCycleValue || !selectedStudentValue}
          className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isPending ? "Generating..." : "Generate draft"}
        </button>

        {draft ? (
          <a
            className="btn-ghost inline-flex items-center justify-center rounded-full px-4 py-2 text-center text-sm font-semibold"
            href={`/api/reports/${draft.id}/export`}
          >
            Export CSV
          </a>
        ) : null}

        {statusMessage ? <p className="text-xs text-[var(--text-subtle)]">{statusMessage}</p> : null}
      </aside>

      <section className="grid gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Draft</h2>
          <button
            type="button"
            onClick={finalize}
            disabled={isPending || !canFinalize}
            className="btn-ghost rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Finalize draft
          </button>
        </div>

        {draft ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Sentences</p>
                <p className="mt-1 text-2xl font-semibold">{sentenceCount}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Cited</p>
                <p className="mt-1 text-2xl font-semibold">{citedSentenceCount}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Coverage</p>
                <p className="mt-1 text-2xl font-semibold">{citationCoverage}%</p>
              </div>
            </div>

            {citationCoverage < 100 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm text-[var(--text-subtle)]">
                Coverage is below 100%. Regenerate or edit before finalizing.
              </div>
            ) : null}

            <textarea
              rows={10}
              value={editableText}
              onChange={(event) => setEditableText(event.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6"
            />

            <div className="grid gap-3">
              {draft.citations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--text-subtle)]">
                  No citations returned. Approve more evidence and regenerate.
                </p>
              ) : (
                draft.citations.map((citation) => (
                  <article
                    key={`${citation.id}-${citation.sentenceIndex}`}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-subtle)]">Evidence</p>
                    <p className="mt-1 text-sm text-[var(--text-main)]">{citation.evidenceCard.aiSummary}</p>
                    <p className="mt-2 text-xs text-[var(--text-subtle)]">{citation.evidenceCard.evidenceText}</p>
                  </article>
                ))
              )}
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-subtle)]">
            Generate a draft to begin.
          </p>
        )}
      </section>
    </div>
  );
}
