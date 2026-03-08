import { ReportStudio } from "@/components/report-studio";
import { FadeIn } from "@/components/fade-in";
import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
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

  const sectionIds = assignments.map((assignment) => assignment.section.id);

  const [cycles, enrollments, pendingEvidence, approvedEvidence, finalizedDrafts] = await Promise.all([
    prisma.reportCycle.findMany({
      where: {
        sectionId: {
          in: sectionIds,
        },
      },
      orderBy: {
        periodStart: "desc",
      },
    }),
    prisma.enrollment.findMany({
      where: {
        sectionId: {
          in: sectionIds,
        },
      },
      include: {
        section: true,
        student: true,
      },
      orderBy: {
        student: {
          fullName: "asc",
        },
      },
    }),
    prisma.evidenceCard.count({
      where: {
        sectionId: { in: sectionIds },
        status: "PENDING",
      },
    }),
    prisma.evidenceCard.count({
      where: {
        sectionId: { in: sectionIds },
        status: "APPROVED",
      },
    }),
    prisma.reportDraft.count({
      where: {
        cycle: {
          sectionId: { in: sectionIds },
        },
        status: "FINALIZED",
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
              <p className="pill">Step 3 of 3</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Reports</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-subtle)]">
                Build polished report drafts from classroom evidence, apply your teacher voice, and finalize with confidence.
              </p>
              <p className="mt-3 text-sm font-medium text-[var(--text-main)]">
                Select a cycle scope, choose evidence source, and generate one student draft at a time.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Pending evidence</p>
                <p className="mt-1 text-2xl font-semibold">{pendingEvidence}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Approved evidence</p>
                <p className="mt-1 text-2xl font-semibold">{approvedEvidence}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Cycles</p>
                <p className="mt-1 text-2xl font-semibold">{cycles.length}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Finalized drafts</p>
                <p className="mt-1 text-2xl font-semibold">{finalizedDrafts}</p>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.08}>
        <ReportStudio
          sections={assignments.map((assignment) => ({
            id: assignment.section.id,
            label: `${assignment.section.courseCode} ${assignment.section.name} - ${assignment.section.term}`,
          }))}
          cycles={cycles.map((cycle) => ({
            id: cycle.id,
            name: cycle.name,
            sectionId: cycle.sectionId,
            periodStart: cycle.periodStart.toISOString(),
            periodEnd: cycle.periodEnd.toISOString(),
          }))}
          students={enrollments.map((enrollment) => ({
            id: enrollment.student.id,
            fullName: enrollment.student.fullName,
            sectionId: enrollment.sectionId,
          }))}
        />
      </FadeIn>
    </div>
  );
}
