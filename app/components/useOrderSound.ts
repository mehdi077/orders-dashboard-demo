"use client";

import { useEffect, useRef } from "react";

function playChime() {
  if (typeof window === "undefined") return;
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;

    const ctx = new AC();
    const now = ctx.currentTime;

    const notes: Array<{ f: number; t: number }> = [
      { f: 880, t: 0 },
      { f: 1320, t: 0.18 },
      { f: 1760, t: 0.36 },
    ];

    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;

      const start = now + t;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.75);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.8);
    });

    setTimeout(() => ctx.close().catch(() => undefined), 1500);
  } catch {
    // audio failures are non-fatal
  }
}

export function useNewOrderSound(orderIds: readonly string[] | undefined) {
  const prev = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!orderIds) return;
    const current = new Set(orderIds);

    if (prev.current !== null) {
      for (const id of current) {
        if (!prev.current.has(id)) {
          playChime();
          break;
        }
      }
    }
    prev.current = current;
  }, [orderIds]);
}
