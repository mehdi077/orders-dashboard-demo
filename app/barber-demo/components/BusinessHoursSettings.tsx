"use client";

import { type BusinessHours, formatHourOption } from "../lib/businessHours";

const START_OPTIONS = Array.from({ length: 24 }, (_, i) => i); // 0..23
const END_OPTIONS = Array.from({ length: 24 }, (_, i) => i + 1); // 1..24
const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60];

type Props = {
  value: BusinessHours;
  onChange: (v: BusinessHours) => void;
};

export function BusinessHoursSettings({ value, onChange }: Props) {
  function setStart(h: number) {
    const endHour = Math.max(h + 1, value.endHour);
    onChange({ ...value, startHour: h, endHour });
  }
  function setEnd(h: number) {
    const startHour = Math.min(value.startHour, h - 1);
    onChange({ ...value, endHour: h, startHour });
  }
  function setSlot(m: number) {
    onChange({ ...value, slotMinutes: m });
  }

  const selectCls =
    "mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/40";
  const labelCls =
    "text-[11px] font-bold uppercase tracking-widest text-slate-300";

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-fuchsia-300/90">
            Settings
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-white">
            Business hours
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Controls the time dropdown and the agenda view.
          </p>
        </div>
        <p className="text-[11px] font-semibold text-slate-400">
          {formatHourOption(value.startHour)} – {formatHourOption(value.endHour)} ·{" "}
          {value.slotMinutes} min slots
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={labelCls}>Opens</span>
          <select
            className={selectCls}
            value={value.startHour}
            onChange={(e) => setStart(Number(e.target.value))}
          >
            {START_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {formatHourOption(h)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Closes</span>
          <select
            className={selectCls}
            value={value.endHour}
            onChange={(e) => setEnd(Number(e.target.value))}
          >
            {END_OPTIONS.filter((h) => h > value.startHour).map((h) => (
              <option key={h} value={h}>
                {formatHourOption(h)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={labelCls}>Slot</span>
          <select
            className={selectCls}
            value={value.slotMinutes}
            onChange={(e) => setSlot(Number(e.target.value))}
          >
            {SLOT_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
