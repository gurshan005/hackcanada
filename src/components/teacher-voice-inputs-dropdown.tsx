"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronDown } from "lucide-react";
import { useState } from "react";

export function TeacherVoiceInputsDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="grid gap-3">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls="teacher-voice-inputs"
          aria-label={isOpen ? "Collapse Teacher Voice inputs" : "Expand Teacher Voice inputs"}
          className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] text-[var(--text-subtle)] shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-colors hover:bg-[var(--surface-muted)]"
        >
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex"
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.section
            id="teacher-voice-inputs"
            key="teacher-voice-inputs"
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <div className="flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <BookOpen className="h-4 w-4 text-white/90" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-main)]">Teacher Voice Inputs</p>
                  <p className="text-xs text-[var(--text-subtle)]">Past reports, style notes, and saved examples</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Past Reports</p>
                  <h4 className="mt-1 text-base font-semibold">Upload writing samples</h4>
                  <p className="mt-1 text-sm text-[var(--text-subtle)]">Use previous report cards to anchor voice and consistency.</p>

                  <label className="mt-4 block rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-center text-xs text-[var(--text-subtle)]">
                    <input type="file" accept=".txt,.md,.doc,.docx,.pdf" multiple className="hidden" />
                    Drop files or click to choose
                  </label>

                  <button type="button" className="btn-primary mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                    Add to Teacher Voice
                  </button>
                </article>

                <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Writing Style Notes</p>
                  <h4 className="mt-1 text-base font-semibold">Define your reporting style</h4>
                  <p className="mt-1 text-sm text-[var(--text-subtle)]">Capture preferred language and feedback patterns.</p>

                  <textarea
                    rows={6}
                    placeholder="Example: Keep tone warm and specific. Lead with growth evidence, then next steps in clear classroom language."
                    className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                  />

                  <button type="button" className="btn-primary mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                    Save Style Notes
                  </button>
                </article>

                <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-subtle)]">Saved Files & Examples</p>
                  <h4 className="mt-1 text-base font-semibold">Add supporting context</h4>
                  <p className="mt-1 text-sm text-[var(--text-subtle)]">Bring in notes and examples that improve continuity across report cycles.</p>

                  <label className="mt-4 block rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-4 text-center text-xs text-[var(--text-subtle)]">
                    <input type="file" accept=".txt,.md,.csv" multiple className="hidden" />
                    Select files and examples
                  </label>

                  <button type="button" className="btn-primary mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                    Save to Memory
                  </button>
                </article>
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

