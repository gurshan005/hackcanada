import Link from "next/link";

import { FadeIn } from "@/components/fade-in";
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
    <div className="grid gap-5">
      <FadeIn>
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

      <FadeIn delay={0.08}>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">Context Library</h3>
              <p className="mt-1 max-w-2xl text-sm text-[var(--text-subtle)]">
                Add past reports, special instruction style notes, and scattered text files so report generation sounds more natural and consistent with your voice.
              </p>
            </div>
            <span className="pill">{finalizedDraftCount} finalized reports available</span>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Previous Reports</p>
              <h4 className="mt-1 text-base font-semibold">Upload writing samples</h4>
              <p className="mt-1 text-sm text-[var(--text-subtle)]">Use old report cards to teach tone and sentence style.</p>

              <label className="mt-3 block rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-center text-xs text-[var(--text-subtle)]">
                <input type="file" accept=".txt,.md,.doc,.docx,.pdf" multiple className="hidden" />
                Drop files or click to choose
              </label>

              <button type="button" className="btn-primary mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                Add To Library
              </button>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Special Instructions</p>
              <h4 className="mt-1 text-base font-semibold">Define what to look for</h4>
              <p className="mt-1 text-sm text-[var(--text-subtle)]">Set behavior look-fors and preferred language for feedback.</p>

              <textarea
                rows={6}
                placeholder="Example: Prioritize evidence of respectful disagreement, follow-up questions, and task-start behavior in independent work."
                className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
              />

              <button type="button" className="btn-ghost mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                Save Instructions
              </button>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Scattered Data</p>
              <h4 className="mt-1 text-base font-semibold">Ingest loose text files</h4>
              <p className="mt-1 text-sm text-[var(--text-subtle)]">Upload `.txt` notes from any folder to centralize evidence context.</p>

              <label className="mt-3 block rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-center text-xs text-[var(--text-subtle)]">
                <input type="file" accept=".txt,.md,.csv" multiple className="hidden" />
                Select scattered files
              </label>

              <button type="button" className="btn-ghost mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                Log Files
              </button>
            </article>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
