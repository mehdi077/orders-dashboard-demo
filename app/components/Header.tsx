"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArchiveIcon, ArrowLeftIcon } from "./icons";

type Theme = "active" | "completed";

type HeaderProps = {
  title: string;
  rightSlot?: ReactNode;
  theme: Theme;
};

export function Header({ title, rightSlot, theme }: HeaderProps) {
  const isActive = theme === "active";

  return (
    <header
      className={
        isActive
          ? "sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white px-3 py-3 shadow-sm sm:gap-4 sm:px-6 sm:py-5"
          : "sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-slate-700 bg-slate-950 px-3 py-3 shadow-xl sm:gap-4 sm:px-6 sm:py-5"
      }
    >
      <div className="flex min-w-0 items-center gap-4">
        <h1
          className={
            isActive
              ? "truncate text-lg font-black tracking-tight text-neutral-900 sm:text-2xl md:text-3xl"
              : "truncate text-lg font-black tracking-tight text-emerald-400 sm:text-2xl md:text-3xl"
          }
        >
          {title}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href="/barber-demo"
          aria-label="Open barber demo"
          className={
            isActive
              ? "inline-flex items-center rounded-xl border-2 border-fuchsia-700 bg-fuchsia-700 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition hover:bg-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-lg"
              : "inline-flex items-center rounded-xl border-2 border-fuchsia-300 bg-transparent px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide text-fuchsia-200 shadow-md transition hover:bg-fuchsia-300/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-300 focus:ring-offset-2 focus:ring-offset-slate-950 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-lg"
          }
        >
          Barber Demo
        </Link>
        {isActive ? (
          <Link
            href="/completed"
            aria-label="View completed orders"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-900 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 sm:gap-3 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-lg"
          >
            <ArchiveIcon className="h-5 w-5 sm:h-7 sm:w-7" />
            <span className="hidden sm:inline">Completed</span>
          </Link>
        ) : (
          <Link
            href="/"
            aria-label="Back to active orders"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide text-slate-950 shadow-md transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950 sm:gap-3 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-lg"
          >
            <ArrowLeftIcon className="h-5 w-5 sm:h-7 sm:w-7" />
            <span className="hidden sm:inline">Active</span>
          </Link>
        )}
        {rightSlot}
      </div>
    </header>
  );
}
