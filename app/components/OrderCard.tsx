"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { ElapsedTime } from "./ElapsedTime";
import { CheckIcon } from "./icons";

type Props = {
  order: Doc<"orders">;
};

export function OrderCard({ order }: Props) {
  const markCompleted = useMutation(api.orders.markCompleted);
  const [completing, setCompleting] = useState(false);

  async function onDone() {
    setCompleting(true);
    try {
      await markCompleted({ id: order._id });
    } finally {
      setCompleting(false);
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-lg">
      <div className="flex-1 space-y-3 p-4 sm:space-y-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">
            {order.customerName}
          </h3>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-600 sm:text-xs">
            #{order._id.slice(-5)}
          </span>
        </div>

        <ElapsedTime createdAt={order.createdAt} />

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 sm:text-xs">
            Items
          </p>
          <p className="mt-1 whitespace-pre-wrap text-lg font-bold leading-snug sm:text-2xl">
            {order.items}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 sm:text-xs">
              Quantity
            </p>
            <p className="mt-1 text-xl font-black sm:text-2xl">
              {order.quantity}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 sm:text-xs">
              Phone
            </p>
            <p className="mt-1 text-base font-bold sm:text-xl">
              {order.phoneNumber}
            </p>
          </div>
        </div>

        {order.specialInstructions && (
          <div className="rounded-lg bg-yellow-50 p-2.5 ring-1 ring-yellow-200 sm:p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-700 sm:text-xs">
              Special Instructions
            </p>
            <p className="mt-1 text-base font-semibold text-yellow-900 sm:text-lg">
              {order.specialInstructions}
            </p>
          </div>
        )}

        <p className="text-sm font-bold text-neutral-500 sm:text-base">
          Placed {new Date(order.createdAt).toLocaleTimeString()}
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        disabled={completing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-b-2xl bg-green-600 py-3.5 text-base font-black uppercase tracking-wide text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-3 sm:py-5 sm:text-xl"
      >
        <CheckIcon className="h-5 w-5 sm:h-7 sm:w-7" />
        {completing ? "Completing..." : "Mark Completed"}
      </button>
    </article>
  );
}
