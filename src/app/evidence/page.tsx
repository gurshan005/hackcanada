import Link from "next/link";
import { format } from "date-fns";

import { EvidenceActionButtons } from "@/components/evidence-action-buttons";
import { FadeIn } from "@/components/fade-in";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  sectionId?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}>;

function trimText(value: string, max = 260) {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max).trim()}...`;
}

export default async function EvidencePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await getDemoUser();

  const assignments = await prisma.teachingAssignment.findMany({
    where: {
      userId: user.id,
    },
    include: {
      section: true,
    },
    orderBy: {
      section: {
        createdAt: "asc",
      },
    },
  });

  const fallbackSectionId = assignments[0]?.section.id;
  const sectionId = params.sectionId && assignments.some((item) => item.section.id === params.sectionId)
    ? params.sectionId
    : fallbackSectionId;
  const statusFilter = params.status ?? "PENDING";

  if (!sectionId) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-subtle)]">No sections found. Seed demo data first.</p>
      </section>
    );
  }

  const [students, evidenceCards, pendingTotal, unassignedPending] = await Promise.all([
    prisma.enrollment.findMany({
      where: { sectionId },
      include: { student: true },
      orderBy: { student: { fullName: "asc" } },
    }),
    prisma.evidenceCard.findMany({
      where: {
        sectionId,
        status: statusFilter,
      },
      include: {
        student: true,
        session: true,
      },
      orderBy: {
        observedAt: "desc",
      },
      take: 100,
    }),
    prisma.evidenceCard.count({
      where: {
        sectionId,
        status: "PENDING",
      },
    }),
    prisma.evidenceCard.count({
      where: {
        sectionId,
        status: "PENDING",
        studentId: null,
      },
    }),
  ]);

  return (
    <div className="grid gap-5">
      <FadeIn>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="pill">Step 2 of 3</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Review</h2>
              <p className="mt-1 text-sm text-[var(--text-subtle)]">Approve or reject evidence.</p>
            </div>
            <Link href="/capture" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
              Capture
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="pill">Pending {pendingTotal}</span>
            <span className="pill">Unassigned {unassignedPending}</span>
          </div>

          <form className="mt-4 grid gap-2 sm:grid-cols-3">
            <select
              name="sectionId"
              defaultValue={sectionId}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
            >
              {assignments.map((assignment) => (
                <option key={assignment.section.id} value={assignment.section.id}>
                  {assignment.section.courseCode} {assignment.section.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={statusFilter}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button type="submit" className="btn-ghost rounded-xl px-3 py-2 text-sm font-semibold">
              Apply
            </button>
          </form>
        </section>
      </FadeIn>

      <section className="grid gap-3">
        {evidenceCards.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-sm text-[var(--text-subtle)]">
            No evidence for this filter.
          </p>
        ) : (
          evidenceCards.map((card, index) => (
            <FadeIn key={card.id} delay={Math.min(0.02 * index, 0.12)}>
              <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">
                      {card.student ? (
                        <Link href={`/students/${card.student.id}`} className="underline decoration-dotted underline-offset-4">
                          {card.student.fullName}
                        </Link>
                      ) : (
                        "Unassigned"
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-subtle)]">
                      {card.session?.title ?? "No session"} · {format(card.observedAt, "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  <StatusBadge value={card.status} />
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_310px]">
                  <div className="grid gap-2">
                    <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-main)]">
                      {trimText(card.aiSummary)}
                    </p>
                    <p className="text-xs text-[var(--text-subtle)]">
                      {card.observationType.replaceAll("_", " ")} · {(card.confidence * 100).toFixed(1)}% confidence
                    </p>
                    <details className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold text-[var(--text-subtle)]">Raw note</summary>
                      <p className="mt-2 text-xs leading-5 text-[var(--text-subtle)]">{card.evidenceText}</p>
                    </details>
                  </div>

                  {card.status === "PENDING" ? (
                    <EvidenceActionButtons
                      evidenceId={card.id}
                      currentSummary={card.aiSummary}
                      currentStudentId={card.studentId}
                      students={students.map((item) => ({
                        id: item.student.id,
                        fullName: item.student.fullName,
                      }))}
                    />
                  ) : (
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <p className="text-xs font-semibold text-[var(--text-subtle)]">Final summary</p>
                      <p className="mt-2 text-sm text-[var(--text-main)]">{card.aiSummary}</p>
                    </div>
                  )}
                </div>
              </article>
            </FadeIn>
          ))
        )}
      </section>
    </div>
  );
}
