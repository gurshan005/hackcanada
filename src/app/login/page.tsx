import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">ClassTrack</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-main)]">Login</h1>
        <p className="mt-2 text-sm text-[var(--text-subtle)]">Auth will be added next. Continue to the dashboard.</p>

        <Link href="/dashboard" className="btn-primary mt-6 inline-flex w-full justify-center rounded-full px-4 py-2.5 text-sm font-semibold">
          Continue to Dashboard
        </Link>
      </section>
    </main>
  );
}
