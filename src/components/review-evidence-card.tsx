"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { EvidenceActionButtons } from "@/components/evidence-action-buttons";

type StudentOption = {
  id: string;
  fullName: string;
};

type ReviewCardData = {
  id: string;
  studentId: string | null;
  studentName: string | null;
  sessionTitle: string | null;
  observedAtLabel: string;
  aiSummary: string;
  observationType: string;
  confidencePct: string;
  evidenceText: string;
};

type Props = {
  card: ReviewCardData;
  students: StudentOption[];
  delay?: number;
};

function trimText(value: string, max = 260) {
  if (value.length <= max) {
    return value;
  }

  return `${value.slice(0, max).trim()}...`;
}

export function ReviewEvidenceCard({ card, students, delay = 0 }: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [closed, setClosed] = useState(false);

  if (closed) {
    return null;
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={
        isClosing
          ? {
              opacity: 0,
              height: 0,
              marginBottom: 0,
              paddingTop: 0,
              paddingBottom: 0,
            }
          : {
              opacity: 1,
              y: 0,
              height: "auto",
            }
      }
      transition={{ duration: 0.24, delay, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (isClosing) {
          setClosed(true);
        }
      }}
      className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {card.studentId && card.studentName ? (
              <Link href={`/students/${card.studentId}`} className="underline decoration-dotted underline-offset-4">
                {card.studentName}
              </Link>
            ) : (
              "Unassigned"
            )}
          </p>
          <p className="text-xs text-[var(--text-subtle)]">
            {card.sessionTitle ?? "No session"} - {card.observedAtLabel}
          </p>
        </div>

        <span className="rounded-full border border-amber-300/35 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold text-amber-100">
          Pending review
        </span>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_330px]">
        <div className="grid gap-2">
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-main)]">
            {trimText(card.aiSummary)}
          </p>
          <p className="text-xs text-[var(--text-subtle)]">
            {card.observationType} - {card.confidencePct}% confidence
          </p>
          <details className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--text-subtle)]">Teacher source note</summary>
            <p className="mt-2 text-xs leading-5 text-[var(--text-subtle)]">{card.evidenceText}</p>
          </details>
        </div>

        <EvidenceActionButtons
          evidenceId={card.id}
          currentSummary={card.aiSummary}
          currentStudentId={card.studentId}
          students={students}
          onResolved={() => setIsClosing(true)}
        />
      </div>
    </motion.article>
  );
}
