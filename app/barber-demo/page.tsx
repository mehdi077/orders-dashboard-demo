"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  addMonths,
  formatMonthTitle,
  getMonthGrid,
  isSameLocalDay,
  startOfMonth,
} from "./lib/calendar";
import { type Appointment } from "./lib/constants";
import { DayTimelineVerticalMini } from "./components/DayTimelineVerticalMini";
import { DayModal } from "./components/DayModal";
import { AppointmentSidePanel } from "./components/AppointmentSidePanel";
import { BusinessHoursSettings } from "./components/BusinessHoursSettings";
import { type BusinessHours, formatHourOption } from "./lib/businessHours";
import type { Id } from "../../convex/_generated/dataModel";

type SubmitArgs = {
  id: Id<"barberAppointments"> | null;
  dayKey: string;
  startTime: number;
  durationMinutes: number;
  clientName: string;
  phoneNumber: string;
  service?: string;
  notes?: string;
  chair: number;
};

const DEFAULT_SETTINGS = {
  chairs: 5,
  startHour: 8,
  endHour: 20,
  slotMinutes: 30,
};

export default function BarberDemoPage() {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const today = useMemo(() => new Date(), []);
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [panelAppointment, setPanelAppointment] = useState<Appointment | null>(null);

  const monthGrid = useMemo(() => getMonthGrid(monthCursor), [monthCursor]);
  const appts = useQuery(api.barberAppointments.listScheduledInRange, {
    startTime: monthGrid.gridStart.getTime(),
    endTime: monthGrid.gridEndExclusive.getTime(),
  });

  const settings = useQuery(api.barberAppointments.getBarberSettings, {});
  const updateSettings = useMutation(api.barberAppointments.updateBarberSettings);

  const create = useMutation(api.barberAppointments.create);
  const update = useMutation(api.barberAppointments.update);
  const cancel = useMutation(api.barberAppointments.cancel);

  const chairs = settings?.chairs ?? DEFAULT_SETTINGS.chairs;
  const businessHours: BusinessHours = useMemo(() => ({
    startHour: settings?.startHour ?? DEFAULT_SETTINGS.startHour,
    endHour: settings?.endHour ?? DEFAULT_SETTINGS.endHour,
    slotMinutes: settings?.slotMinutes ?? DEFAULT_SETTINGS.slotMinutes,
  }), [settings]);

  function handleUpdateSettings(next: BusinessHours & { chairs: number }) {
    updateSettings({
      chairs: next.chairs,
      startHour: next.startHour,
      endHour: next.endHour,
      slotMinutes: next.slotMinutes,
    });
  }

  const apptsByDayKey = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    if (!appts) return map;
    for (const a of appts) {
      const arr = map.get(a.dayKey) ?? [];
      arr.push(a);
      map.set(a.dayKey, arr);
    }
    return map;
  }, [appts]);

  const liveSelectedAppt = useMemo(() => {
    if (!panelAppointment || !appts) return panelAppointment;
    return appts.find((a) => a._id === panelAppointment._id) ?? null;
  }, [panelAppointment, appts]);

  const modalAppts: Appointment[] = modalDate
    ? apptsByDayKey.get(keyFor(modalDate)) ?? []
    : [];

  const panelDayAppts: Appointment[] = liveSelectedAppt
    ? apptsByDayKey.get(liveSelectedAppt.dayKey) ?? []
    : [];

  function handleSelectAppointment(a: Appointment) {
    setPanelAppointment(a);
  }

  async function handleCreate(args: SubmitArgs) {
    const { id: _id, ...rest } = args;
    void _id;
    await create(rest);
  }

  async function handleUpdate(args: SubmitArgs) {
    if (!args.id) return;
    const { id, ...rest } = args;
    await update({ id, ...rest });
  }

  async function handleCancelAppointment(a: Appointment) {
    await cancel({ id: a._id });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-300/90">
            Barber Demo
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Booking Calendar
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            Glance the day at a time. Click any day for its full agenda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-100 shadow-sm transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
          >
            Back to Kitchen
          </Link>
        </div>
      </header>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-extrabold text-white">
            {formatMonthTitle(monthCursor)}
          </h2>
          <div className="flex items-center gap-2">
            <NavButton onClick={() => setMonthCursor((d) => addMonths(d, -1))}>Prev</NavButton>
            <NavButton onClick={() => setMonthCursor(startOfMonth(new Date()))}>Today</NavButton>
            <NavButton onClick={() => setMonthCursor((d) => addMonths(d, 1))}>Next</NavButton>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 sm:gap-2 sm:text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-1 py-1 text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="relative mt-2">
        <div
          className={[
            "grid grid-cols-7 gap-1 sm:gap-2 transition-all duration-300",
            appts === undefined ? "pointer-events-none blur-sm select-none" : "",
          ].join(" ")}
        >
          {monthGrid.days.map((day) => {
            const dayAppts = apptsByDayKey.get(day.dayKey) ?? [];
            const isToday = isSameLocalDay(day.date, today);
            const isPast = day.date < todayStart;
            return (
              <button
                key={day.dayKey}
                type="button"
                onClick={() => setModalDate(day.date)}
                className={[
                  "group relative h-24 overflow-hidden rounded-xl border text-left shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70",
                  "sm:h-32 sm:rounded-2xl md:h-36 lg:h-40",
                  isPast
                    ? "border-white/[0.06] bg-slate-900/30 [filter:saturate(0.6)] hover:border-white/10 hover:bg-slate-900/40"
                    : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-fuchsia-400/40 hover:bg-white/[0.07]",
                  day.inMonth ? "" : "opacity-50",
                ].join(" ")}
              >
                {isPast ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0,transparent_6px,rgba(255,255,255,0.025)_6px,rgba(255,255,255,0.025)_7px)]"
                  />
                ) : null}

                {dayAppts.length > 0 ? (
                  <DayTimelineVerticalMini
                    appointments={dayAppts}
                    startHour={businessHours.startHour}
                    endHour={businessHours.endHour}
                    chairs={chairs}
                  />
                ) : null}

                <div className="absolute left-1 top-1 z-10 flex items-center gap-1 sm:left-1.5 sm:top-1.5">
                  <span
                    className={[
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black sm:h-5 sm:min-w-5 sm:text-[11px]",
                      isToday
                        ? "bg-fuchsia-500 text-white shadow-[0_0_0_2px_rgba(217,70,239,0.25)]"
                        : isPast
                        ? "text-slate-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]",
                    ].join(" ")}
                  >
                    {day.date.getDate()}
                  </span>
                  {dayAppts.length > 0 ? (
                    <span
                      className={[
                        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black shadow-[0_0_0_1px_rgba(255,255,255,0.15)]",
                        isPast
                          ? "bg-slate-500/60 text-slate-100"
                          : "bg-fuchsia-500/70 text-white",
                      ].join(" ")}
                    >
                      {dayAppts.length}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {appts === undefined ? (
          <div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-950/30 backdrop-blur-sm"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2 shadow-2xl">
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-fuchsia-400/30 border-t-fuchsia-300"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                Loading calendar…
              </span>
            </div>
          </div>
        ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-3 bg-gradient-to-r from-fuchsia-400 to-indigo-400" />
            Appointment
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-px w-3 bg-white/20" />
            Noon
          </span>
          <span>
            Top: {formatHourOption(businessHours.startHour)} · Bottom:{" "}
            {formatHourOption(businessHours.endHour)}
          </span>
        </div>
      </section>

      <BusinessHoursSettings
        value={businessHours}
        onChange={(bh) => handleUpdateSettings({ ...bh, chairs })}
        chairs={chairs}
        onChangeChairs={(c) => handleUpdateSettings({ ...businessHours, chairs: c })}
      />

      <DayModal
        open={modalDate !== null}
        date={modalDate}
        appointments={modalAppts}
        businessHours={businessHours}
        chairs={chairs}
        readOnly={modalDate !== null && modalDate < todayStart}
        selectedAppointmentId={liveSelectedAppt?._id ?? null}
        onClose={() => setModalDate(null)}
        onSelectAppointment={handleSelectAppointment}
        onCreate={handleCreate}
      />

      <AppointmentSidePanel
        open={liveSelectedAppt !== null}
        appointment={liveSelectedAppt}
        businessHours={businessHours}
        dayAppointments={panelDayAppts}
        chairs={chairs}
        transparentBackdrop={modalDate !== null}
        onClose={() => setPanelAppointment(null)}
        onUpdate={handleUpdate}
        onCancelAppointment={handleCancelAppointment}
      />
    </div>
  );
}

function keyFor(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function NavButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/70"
    >
      {children}
    </button>
  );
}
