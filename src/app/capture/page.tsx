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
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.4)] md:p-8">
          <div className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-[#3b82f6]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-[#b08968]/20 blur-3xl" />

          <div className="relative grid gap-6">
            <div>
              <p className="pill">Step 1 of 3</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Capture</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-subtle)]">
                Capture transcribes your typed note or audio, then sends it to an AI agent to extract structured evidence cards for review.
              </p>
              <p className="mt-3 text-sm font-medium text-[var(--text-main)]">
                Write fast. Transcribe automatically. Hand off to AI in one step.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Input</p>
                <p className="mt-1 text-sm text-[var(--text-main)]">Add a quick classroom note or upload an audio clip.</p>
              </article>
              <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Transcribe</p>
                <p className="mt-1 text-sm text-[var(--text-main)]">Your capture is converted into transcript segments automatically.</p>
              </article>
              <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">AI Agent</p>
                <p className="mt-1 text-sm text-[var(--text-main)]">The AI agent structures evidence cards for your Review step.</p>
              </article>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 md:p-6">
              <CaptureForm
                sections={sections.map((assignment) => ({
                  id: assignment.section.id,
                  label: `${assignment.section.courseCode} ${assignment.section.name} - ${assignment.section.term}`,
                }))}
              />
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
