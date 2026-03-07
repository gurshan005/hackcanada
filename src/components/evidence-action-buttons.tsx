"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type StudentOption = {
  id: string;
  fullName: string;
};

type Props = {
  evidenceId: string;
  currentSummary: string;
  currentStudentId: string | null;
  students: StudentOption[];
};

export function EvidenceActionButtons({ evidenceId, currentSummary, currentStudentId, students }: Props) {
  const router = useRouter();
  const [summary, setSummary] = useState(currentSummary);
  const [studentId, setStudentId] = useState(currentStudentId ?? "");
  const [feedback, setFeedback] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const hasStudents = students.length > 0;
  const defaultLabel = useMemo(() => (hasStudents ? "Unassigned" : "No roster"), [hasStudents]);

  const patchEvidence = (status: "APPROVED" | "REJECTED") => {
    startTransition(async () => {
      setFeedback("");
      const response = await fetch(`/api/evidence/${evidenceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          aiSummary: summary,
          studentId: studentId || null,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setFeedback(data.error ?? "Update failed.");
        return;
      }

      setFeedback(status === "APPROVED" ? "Approved and synced." : "Marked as rejected.");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <div className="grid gap-2">
        <label htmlFor={`student-${evidenceId}`} className="text-xs font-semibold text-[var(--text-subtle)]">
          Student
        </label>
        <select
          id={`student-${evidenceId}`}
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        >
          <option value="">{defaultLabel}</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label htmlFor={`summary-${evidenceId}`} className="text-xs font-semibold text-[var(--text-subtle)]">
          Summary
        </label>
        <textarea
          id={`summary-${evidenceId}`}
          rows={3}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => patchEvidence("APPROVED")}
          disabled={isPending}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-main)] disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => patchEvidence("REJECTED")}
          disabled={isPending}
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-subtle)] disabled:opacity-50"
        >
          Reject
        </button>
      </div>

      {feedback ? <p className="text-xs text-[var(--text-subtle)]">{feedback}</p> : null}
    </div>
  );
}
