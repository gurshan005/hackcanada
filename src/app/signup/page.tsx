"use client";

import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";

type SignupStatus = {
  type: "idle" | "error" | "success";
  message: string;
};

export default function SignupPage() {
  const [status, setStatus] = useState<SignupStatus>({ type: "idle", message: "" });
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    startTransition(async () => {
      setStatus({ type: "idle", message: "" });

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
        }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setStatus({ type: "error", message: data.error ?? "Could not create signup." });
        return;
      }

      setStatus({
        type: "success",
        message: data.message ?? "Signup created successfully.",
      });
      form.reset();
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">ClassTrack</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-main)]">Sign Up</h1>
        <p className="mt-2 text-sm text-[var(--text-subtle)]">
          Create a teacher account record. Authentication wiring can be added next.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 text-left">
          <div className="grid gap-2">
            <label htmlFor="fullName" className="text-sm font-semibold text-[var(--text-main)]">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm"
              required
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-[var(--text-main)]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary mt-1 inline-flex w-full justify-center rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Creating..." : "Create Account"}
          </button>
        </form>

        {status.message ? (
          <p className={status.type === "error" ? "mt-4 text-sm text-rose-200" : "mt-4 text-sm text-emerald-200"}>
            {status.message}
          </p>
        ) : null}

        <p className="mt-5 text-sm text-[var(--text-subtle)]">
          Already have access?{" "}
          <Link href="/login" className="underline decoration-dotted underline-offset-4">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
