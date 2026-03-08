import Link from "next/link";

import { FadeIn } from "@/components/fade-in";
import { TeacherVoiceInputsDropdown } from "@/components/teacher-voice-inputs-dropdown";
import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getDemoUser();

  const assignments = await prisma.teachingAssignment.findMany({
    where: { userId: user.id },
    include: {
      section: {
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      },
    },
    orderBy: { section: { createdAt: "asc" } },
  });

  const sectionIds = assignments.map((assignment) => assignment.sectionId);

  if (sectionIds.length === 0) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-subtle)]">No sections found for this teacher profile yet.</p>
      </section>
    );
  }

  const [pendingEvidence, activeCycleCount, finalizedDraftCount] = await Promise.all([
    prisma.evidenceCard.count({
      where: {
        sectionId: { in: sectionIds },
        status: "PENDING",
      },
    }),
    prisma.reportCycle.count({
      where: {
        sectionId: { in: sectionIds },
        periodEnd: {
          gte: new Date(),
        },
      },
    }),
    prisma.reportDraft.count({
      where: {
        cycle: {
          sectionId: { in: sectionIds },
        },
        finalText: {
          not: null,
        },
      },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <FadeIn>
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.4)] md:p-8">
          <div className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-[#3b82f6]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[#b08968]/20 blur-3xl" />

          <div className="relative grid gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">Flagship Capability</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Teacher Voice</h2>
                <span className="pill">{finalizedDraftCount} finalized reports available</span>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-subtle)]">
                Bring in past reports, teacher writing samples, instruction style notes, and saved files so every draft sounds like you. This memory layer keeps report language natural, consistent, and grounded in the material you already trust.
              </p>

              <p className="mt-3 text-sm font-medium text-[var(--text-main)]">
                This is a core differentiator: AI that reflects your real reporting voice, not a generic template.
              </p>

              <p className="mt-4 text-sm text-[var(--text-subtle)]">Use the three inputs below to build Teacher Voice memory.</p>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.05}>
        <TeacherVoiceInputsDropdown />
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-3xl font-semibold tracking-tight">Workflow</h2>
          <p className="mt-1 text-sm text-[var(--text-subtle)]">Move through capture, review, and reports.</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Step 1</p>
              <h3 className="mt-1 text-base font-semibold">Capture</h3>
              <p className="mt-1 text-sm text-[var(--text-subtle)]">Add notes from class moments.</p>
              <Link href="/capture" className="btn-primary mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                Open
              </Link>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Step 2</p>
              <h3 className="mt-1 text-base font-semibold">Review</h3>
              <p className="mt-1 text-sm text-[var(--text-subtle)]">{pendingEvidence} pending cards.</p>
              <Link href="/evidence" className="btn-ghost mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                Open
              </Link>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Step 3</p>
              <h3 className="mt-1 text-base font-semibold">Reports</h3>
              <p className="mt-1 text-sm text-[var(--text-subtle)]">{activeCycleCount} active cycles.</p>
              <Link href="/reports" className="btn-ghost mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                Open
              </Link>
            </article>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
