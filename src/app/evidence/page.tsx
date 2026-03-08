import Link from "next/link";
import { format } from "date-fns";

import { FadeIn } from "@/components/fade-in";
import { ReviewEvidenceCard } from "@/components/review-evidence-card";
import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  sectionId?: string;
}>;

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
        status: "PENDING",
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
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.4)] md:p-8">
          <div className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-[#3b82f6]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[#b08968]/20 blur-3xl" />

          <div className="relative grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="pill">Step 2 of 3</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Review</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-subtle)]">
                  End-of-class review lets you compare your source notes with AI summaries, then accept or reject each one before reports are generated.
                </p>
                <p className="mt-3 text-sm font-medium text-[var(--text-main)]">
                  Your note stays the source of truth. AI assists, teacher decides.
                </p>
              </div>

              <Link href="/capture" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
                Capture
              </Link>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="pill">Pending {pendingTotal}</span>
              <span className="pill">Unassigned {unassignedPending}</span>
            </div>

            <form className="grid gap-2 sm:max-w-sm sm:grid-cols-[1fr_auto]">
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
              <button type="submit" className="btn-ghost rounded-xl px-3 py-2 text-sm font-semibold">
                Apply
              </button>
            </form>
          </div>
        </section>
      </FadeIn>

      <section className="grid gap-3">
        {evidenceCards.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-8 text-sm text-[var(--text-subtle)]">
            No pending review notes in this section.
          </p>
        ) : (
          evidenceCards.map((card, index) => (
            <ReviewEvidenceCard
              key={card.id}
              delay={Math.min(0.02 * index, 0.12)}
              card={{
                id: card.id,
                studentId: card.studentId,
                studentName: card.student?.fullName ?? null,
                sessionTitle: card.session?.title ?? null,
                observedAtLabel: format(card.observedAt, "MMM d, yyyy h:mm a"),
                aiSummary: card.aiSummary,
                observationType: card.observationType.replaceAll("_", " "),
                confidencePct: (card.confidence * 100).toFixed(1),
                evidenceText: card.evidenceText,
              }}
              students={students.map((item) => ({
                id: item.student.id,
                fullName: item.student.fullName,
              }))}
            />
          ))
        )}
      </section>
    </div>
  );
}
