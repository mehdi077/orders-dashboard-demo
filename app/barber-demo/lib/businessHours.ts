"use client";

import { useCallback, useEffect, useState } from "react";

export type BusinessHours = {
  startHour: number; // 0-23
  endHour: number; // 1-24 (exclusive)
  slotMinutes: number;
};

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  startHour: 8,
  endHour: 20,
  slotMinutes: 30,
};

const STORAGE_KEY = "barber-demo:businessHours";

function isValid(v: unknown): v is BusinessHours {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.startHour === "number" &&
    typeof r.endHour === "number" &&
    typeof r.slotMinutes === "number" &&
    r.startHour >= 0 &&
    r.endHour <= 24 &&
    r.endHour > r.startHour &&
    r.slotMinutes >= 5 &&
    r.slotMinutes <= 120
  );
}

export function useBusinessHours() {
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (isValid(parsed)) {
        setHours(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const save = useCallback((next: BusinessHours) => {
    setHours(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  return [hours, save] as const;
}

export function formatHourOption(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  if (hh === 0) return h === 0 ? "12:00 AM" : "12:00 AM (next day)";
  if (hh === 12) return "12:00 PM";
  return hh < 12 ? `${hh}:00 AM` : `${hh - 12}:00 PM`;
}
