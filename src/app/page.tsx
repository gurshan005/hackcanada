import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black">
      <iframe
        src="/preview.html"
        title="ObserveIQ Landing"
        className="h-screen w-full border-0"
      />

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex gap-2 sm:right-6 sm:top-6">
        <Link
          href="/login"
          className="pointer-events-auto rounded-full border border-white/25 bg-black/65 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="pointer-events-auto rounded-full border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black"
        >
          Open App
        </Link>
      </div>
    </div>
  );
}
