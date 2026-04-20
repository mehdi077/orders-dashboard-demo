"use client";

import { useState } from "react";
import { PlusIcon } from "./icons";
import { CreateOrderModal } from "./CreateOrderModal";

export function CreateOrderButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Create new order"
        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:gap-3 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-lg"
      >
        <PlusIcon className="h-5 w-5 sm:h-7 sm:w-7" />
        <span className="hidden sm:inline">Create Order</span>
        <span className="sm:hidden">New</span>
      </button>
      {open && <CreateOrderModal onClose={() => setOpen(false)} />}
    </>
  );
}
