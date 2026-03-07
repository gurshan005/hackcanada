import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  sectionId?: string;
}>;

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const user = await getDemoUser();

  const assignments = await prisma.teachingAssignment.findMany({
    where: { userId: user.id },
    include: { section: true },
    orderBy: { section: { createdAt: "asc" } },
  });

  const allowedSectionIds = assignments.map((assignment) => assignment.section.id);
  const selectedSectionId = params.sectionId && allowedSectionIds.includes(params.sectionId)
    ? params.sectionId
    : allowedSectionIds[0];

  if (!selectedSectionId) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-subtle)]">No sections available. Seed data first.</p>
      </section>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { sectionId: selectedSectionId },
    include: { student: true, section: true },
    orderBy: { student: { fullName: "asc" } },
  });

  const studentIds = enrollments.map((entry) => entry.studentId);

  const [pendingCounts, approvedCounts, recentByStudent] = await Promise.all([
    prisma.evidenceCard.groupBy({
      by: ["studentId"],
      where: {
        sectionId: selectedSectionId,
        status: "PENDING",
        studentId: { in: studentIds },
      },
      _count: { _all: true },
    }),
    prisma.evidenceCard.groupBy({
      by: ["studentId"],
      where: {
        sectionId: selectedSectionId,
        status: "APPROVED",
        studentId: { in: studentIds },
      },
      _count: { _all: true },
    }),
    prisma.evidenceCard.groupBy({
      by: ["studentId"],
      where: {
        sectionId: selectedSectionId,
        studentId: { in: studentIds },
      },
      _max: { observedAt: true },
    }),
  ]);

  const pendingMap = new Map(pendingCounts.map((row) => [row.studentId, row._count._all]));
  const approvedMap = new Map(approvedCounts.map((row) => [row.studentId, row._count._all]));
  const recentMap = new Map(recentByStudent.map((row) => [row.studentId, row._max.observedAt]));

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Students</h2>
            <p className="mt-1 text-sm text-[var(--text-subtle)]">Open a profile to review evidence and drafts.</p>
          </div>

          <form className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2">
            <select
              name="sectionId"
              defaultValue={selectedSectionId}
              className="min-w-[240px] border-0 bg-transparent text-sm"
            >
              {assignments.map((assignment) => (
                <option key={assignment.section.id} value={assignment.section.id}>
                  {assignment.section.courseCode} {assignment.section.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-ghost rounded-full px-3 py-1 text-xs font-semibold">
              Apply
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {enrollments.map((entry) => {
          const pending = pendingMap.get(entry.student.id) ?? 0;
          const approved = approvedMap.get(entry.student.id) ?? 0;
          const recent = recentMap.get(entry.student.id);

          return (
            <Link
              key={entry.id}
              href={`/students/${entry.student.id}`}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5"
            >
              <p className="text-lg font-semibold">{entry.student.fullName}</p>
              <p className="mt-1 text-xs text-[var(--text-subtle)]">{entry.student.externalStudentId ?? "No external ID"}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="pill">Pending {pending}</span>
                <span className="pill">Approved {approved}</span>
              </div>

              <p className="mt-4 text-xs text-[var(--text-subtle)]">
                Last evidence: {recent ? format(recent, "MMM d, yyyy h:mm a") : "No evidence yet"}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
