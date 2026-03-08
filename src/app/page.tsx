import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black">
      <iframe
        src="/preview.html"
        title="ClassTrack Landing"
        className="h-screen w-full border-0"
      />

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex gap-2 sm:right-6 sm:top-6">
        <Link
          href="/login"
          className="pointer-events-auto btn-ghost rounded-full px-4 py-2 text-sm font-semibold"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="pointer-events-auto btn-primary rounded-full px-4 py-2 text-sm font-semibold text-white"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
