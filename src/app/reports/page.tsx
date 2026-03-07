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

  const [cycles, enrollments, pendingEvidence, approvedEvidence] = await Promise.all([
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
  ]);

  return (
    <div className="grid gap-6">
      <FadeIn>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="pill">Step 3 of 3</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Reports</h2>
          <p className="mt-1 text-sm text-[var(--text-subtle)]">Generate, edit, and finalize drafts.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Pending</p>
              <p className="mt-1 text-2xl font-semibold">{pendingEvidence}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Approved</p>
              <p className="mt-1 text-2xl font-semibold">{approvedEvidence}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-subtle)]">Active cycles</p>
              <p className="mt-1 text-2xl font-semibold">{cycles.length}</p>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.08}>
        <ReportStudio
          sections={assignments.map((assignment) => ({
            id: assignment.section.id,
            label: `${assignment.section.courseCode} ${assignment.section.name} • ${assignment.section.term}`,
          }))}
          cycles={cycles.map((cycle) => ({
            id: cycle.id,
            name: cycle.name,
            sectionId: cycle.sectionId,
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
