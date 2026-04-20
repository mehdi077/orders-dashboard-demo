import type { Doc } from "../../convex/_generated/dataModel";
import { CheckIcon } from "./icons";

type Props = {
  order: Doc<"orders">;
};

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function CompletedOrderCard({ order }: Props) {
  const completedAt = order.completedAt;
  const duration = completedAt ? completedAt - order.createdAt : null;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          {order.customerName}
        </h3>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-500/30 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs">
          <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Completed</span>
        </span>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-base font-semibold text-slate-100 sm:mt-3 sm:text-xl">
        {order.items}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
        <div className="rounded-lg bg-slate-900/60 p-2.5 ring-1 ring-slate-700 sm:p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:text-[11px]">
            Qty
          </p>
          <p className="mt-0.5 text-xl font-black text-white sm:text-2xl">
            {order.quantity}
          </p>
        </div>
        <div className="rounded-lg bg-slate-900/60 p-2.5 ring-1 ring-slate-700 sm:p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:text-[11px]">
            Phone
          </p>
          <p className="mt-0.5 text-sm font-bold text-white sm:text-lg">
            {order.phoneNumber}
          </p>
        </div>
      </div>

      {order.specialInstructions && (
        <p className="mt-3 rounded-lg bg-amber-500/10 p-2.5 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30 sm:p-3 sm:text-sm">
          <span className="uppercase tracking-widest">Notes:</span>{" "}
          {order.specialInstructions}
        </p>
      )}

      <div className="mt-3 space-y-0.5 sm:mt-4 sm:space-y-1">
        <p className="text-sm font-bold text-slate-300 sm:text-base">
          Placed{" "}
          <span className="text-white">
            {new Date(order.createdAt).toLocaleTimeString()}
          </span>
        </p>
        {completedAt && (
          <p className="text-sm font-bold text-slate-300 sm:text-base">
            Completed{" "}
            <span className="text-white">
              {new Date(completedAt).toLocaleTimeString()}
            </span>
          </p>
        )}
        {duration !== null && (
          <p className="text-base font-black text-emerald-300 sm:text-lg">
            Took {formatDuration(duration)}
          </p>
        )}
      </div>
    </article>
  );
}
