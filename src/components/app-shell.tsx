"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { Nav } from "@/components/nav";

type Props = {
  children: React.ReactNode;
};

const flowSteps = [
  { id: 1, label: "Capture" },
  { id: 2, label: "Review" },
  { id: 3, label: "Reports" },
];

function getFlowState(pathname: string) {
  if (pathname.startsWith("/capture")) {
    return { show: true, currentStep: 1 };
  }
  if (pathname.startsWith("/evidence")) {
    return { show: true, currentStep: 2 };
  }
  if (pathname.startsWith("/reports") || pathname.startsWith("/students")) {
    return { show: true, currentStep: 3 };
  }
  if (pathname.startsWith("/dashboard")) {
    return { show: true, currentStep: 0 };
  }
  return { show: false, currentStep: 0 };
}

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const isMarketingRoute = pathname === "/" || pathname === "/login" || pathname === "/signup";
  const flow = getFlowState(pathname);

  if (isMarketingRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="page-background" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-sm font-semibold text-white">
                CT
              </div>
              <div>
                <h1 className="text-lg font-semibold">ClassTrack</h1>
                <p className="text-[11px] text-[var(--text-subtle)]">Teacher evidence workspace</p>
              </div>
            </div>

            <Link href="/capture" className="btn-primary rounded-full px-4 py-2 text-sm font-semibold">
              Quick Capture
            </Link>
          </div>

          <div className="mt-4">
            <Nav />
          </div>

          {flow.show ? (
            <div className="mt-3 rounded-2xl border border-white/[0.14] bg-black/[0.24] px-3 py-3">
              <nav aria-label="Progress" className="overflow-x-auto">
                <ol role="list" className="flex min-w-[620px] items-center">
                  {flowSteps.map((step, index) => {
                    const complete = step.id <= flow.currentStep;
                    const current = step.id === flow.currentStep;

                    return (
                      <Fragment key={step.id}>
                        <li className="flex items-center gap-3 pr-1">
                          <span
                            className={clsx(
                              "flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold",
                              complete
                                ? "border-[#3b82f6] bg-[#3b82f6] text-white"
                                : "border-white/[0.26] bg-white/[0.04] text-white/[0.72]",
                            )}
                          >
                            {complete ? (
                              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                                <path
                                  fillRule="evenodd"
                                  d="M16.704 5.29a1 1 0 010 1.415l-7.07 7.07a1 1 0 01-1.415 0L3.29 8.846a1 1 0 111.414-1.414l4.222 4.222 6.364-6.364a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              step.id
                            )}
                          </span>
                          <div className="min-w-[126px]">
                            <p
                              className={clsx(
                                "text-[11px] font-semibold uppercase tracking-[0.12em]",
                                current ? "text-white" : complete ? "text-white/[0.86]" : "text-white/[0.62]",
                              )}
                            >
                              {step.label}
                            </p>
                            <p className="text-[10px] text-white/[0.46]">Step {step.id}</p>
                          </div>
                        </li>

                        {index < flowSteps.length - 1 ? (
                          <span className="mx-1 text-white/[0.4]" aria-hidden="true">
                            →
                          </span>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </ol>
              </nav>

              {flow.currentStep === 0 ? (
                <p className="mt-2 text-xs text-white/[0.62]">Start at Capture to begin progress.</p>
              ) : null}
            </div>
          ) : null}
        </header>

        <main id="main-content" className="mt-6 flex-1">
          {children}
        </main>
      </div>
    </>
  );
}
