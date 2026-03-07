import { CaptureForm } from "@/components/capture-form";
import { FadeIn } from "@/components/fade-in";
import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function CapturePage() {
  const user = await getDemoUser();

  const sections = await prisma.teachingAssignment.findMany({
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

  return (
    <div className="grid gap-6">
      <FadeIn>
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="pill">Step 1 of 3</p>
          <h2 className="text-2xl font-semibold tracking-tight">Capture</h2>
          <p className="mt-1 text-sm text-[var(--text-subtle)]">Add a note or audio clip.</p>

          <div className="mt-5">
            <CaptureForm
              sections={sections.map((assignment) => ({
                id: assignment.section.id,
                label: `${assignment.section.courseCode} ${assignment.section.name} • ${assignment.section.term}`,
              }))}
            />
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
