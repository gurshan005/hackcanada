import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { FadeIn } from "@/components/fade-in";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function StudentTimelinePage({ params }: { params: Params }) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: {
          section: true,
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const evidence = await prisma.evidenceCard.findMany({
    where: {
      studentId: id,
    },
    include: {
      session: true,
      section: true,
    },
    orderBy: {
      observedAt: "desc",
    },
  });

  const drafts = await prisma.reportDraft.findMany({
    where: {
      studentId: id,
    },
    include: {
      cycle: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const approvedCount = evidence.filter((item) => item.status === "APPROVED").length;
  const pendingCount = evidence.filter((item) => item.status === "PENDING").length;

  return (
    <div className="grid gap-6">
      <FadeIn>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-2xl font-semibold tracking-tight">{student.fullName}</h2>
          <p className="mt-1 text-sm text-[var(--text-subtle)]">
            {student.externalStudentId ?? "No external ID"}
            {student.email ? ` · ${student.email}` : ""}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Approved</p>
              <p className="mt-1 text-2xl font-semibold">{approvedCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Pending</p>
              <p className="mt-1 text-2xl font-semibold">{pendingCount}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Drafts</p>
              <p className="mt-1 text-2xl font-semibold">{drafts.length}</p>
            </div>
          </div>
        </section>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <FadeIn delay={0.08}>
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold">Timeline</h3>
            <div className="mt-4 grid gap-3">
              {evidence.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-6 text-sm text-[var(--text-subtle)]">
                  No evidence for this student yet.
                </p>
              ) : (
                evidence.map((card) => (
                  <article key={card.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {card.section.courseCode} {card.section.name}
                        {card.session ? ` · ${card.session.title}` : ""}
                      </p>
                      <StatusBadge value={card.status} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-main)]">{card.aiSummary}</p>
                    <p className="mt-2 text-xs text-[var(--text-subtle)]">{format(card.observedAt, "MMM d, yyyy h:mm a")}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={0.14}>
          <aside className="grid h-fit gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <h3 className="text-base font-semibold">Classes</h3>
            <div className="grid gap-2">
              {student.enrollments.map((enrollment) => (
                <p key={enrollment.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm">
                  {enrollment.section.courseCode} {enrollment.section.name}
                </p>
              ))}
            </div>

            <h3 className="text-base font-semibold">Drafts</h3>
            <div className="grid gap-2">
              {drafts.length === 0 ? (
                <p className="text-sm text-[var(--text-subtle)]">No drafts generated yet.</p>
              ) : (
                drafts.map((draft) => (
                  <p key={draft.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm">
                    {draft.cycle.name}
                  </p>
                ))
              )}
            </div>

            <Link href="/reports" className="btn-primary rounded-full px-4 py-2 text-center text-sm font-semibold">
              Generate report
            </Link>
          </aside>
        </FadeIn>
      </div>
    </div>
  );
}
