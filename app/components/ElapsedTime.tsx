"use client";

import { useEffect, useState } from "react";
import { ClockIcon } from "./icons";

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Tier = {
  label: string;
  wrap: string;
  text: string;
  pulse?: boolean;
};

function tierFor(ms: number): Tier {
  const minutes = ms / 60000;
  if (minutes < 5)
    return {
      label: "On Time",
      wrap: "bg-emerald-50 ring-emerald-200",
      text: "text-emerald-700",
    };
  if (minutes < 15)
    return {
      label: "Pending",
      wrap: "bg-amber-50 ring-amber-300",
      text: "text-amber-700",
    };
  return {
    label: "Overdue",
    wrap: "bg-red-50 ring-red-300",
    text: "text-red-700",
    pulse: true,
  };
}

export function ElapsedTime({ createdAt }: { createdAt: number }) {
  // Keep the first render deterministic (matches SSR) to avoid a
  // hydration mismatch. We only start ticking after mount.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ms = now === null ? 0 : now - createdAt;
  const t = tierFor(ms);
  const display = now === null ? "--:--" : formatElapsed(ms);

  return (
    <div
      className={`flex items-center gap-2 rounded-xl ${t.wrap} px-3 py-2 ring-1 sm:gap-3 sm:px-4 sm:py-3 ${
        t.pulse ? "animate-pulse" : ""
      }`}
    >
      <ClockIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${t.text}`} />
      <div className="leading-none">
        <p
          className={`text-[10px] font-extrabold uppercase tracking-widest sm:text-[11px] ${t.text}`}
        >
          {t.label}
        </p>
        <p
          className={`mt-1 text-2xl font-black tabular-nums sm:text-4xl ${t.text}`}
          suppressHydrationWarning
        >
          {display}
        </p>
      </div>
    </div>
  );
}
