import { clsx } from "clsx";

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        value === "APPROVED" &&
          "border-emerald-300/35 bg-emerald-300/14 text-emerald-100",
        value === "PENDING" &&
          "border-amber-300/35 bg-amber-300/14 text-amber-100",
        value === "REJECTED" &&
          "border-rose-300/35 bg-rose-300/14 text-rose-100",
      )}
    >
      {value.replace("_", " ")}
    </span>
  );
}
