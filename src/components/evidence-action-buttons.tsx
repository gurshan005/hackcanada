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
  onResolved?: () => void;
};

export function EvidenceActionButtons({ evidenceId, currentSummary, currentStudentId, students, onResolved }: Props) {
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

      onResolved?.();
      setTimeout(() => {
        router.refresh();
      }, 220);
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
          Teacher-edited summary
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
          className="rounded-full border border-emerald-300/35 bg-[linear-gradient(135deg,rgba(16,185,129,0.92),rgba(5,150,105,0.88))] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(16,185,129,0.28)] hover:brightness-105 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => patchEvidence("REJECTED")}
          disabled={isPending}
          className="rounded-full border border-rose-300/35 bg-[linear-gradient(135deg,rgba(239,68,68,0.9),rgba(190,24,93,0.86))] px-4 py-2 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(239,68,68,0.24)] hover:brightness-105 disabled:opacity-50"
        >
          Reject
        </button>
      </div>

      {feedback ? <p className="text-xs text-rose-200">{feedback}</p> : null}
    </div>
  );
}
