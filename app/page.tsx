"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../convex/_generated/api";
import { Header } from "./components/Header";
import { CreateOrderButton } from "./components/CreateOrderButton";
import { OrderCard } from "./components/OrderCard";
import { useNewOrderSound } from "./components/useOrderSound";

export default function DashboardPage() {
  const orders = useQuery(api.orders.listActive);

  const orderIds = useMemo(
    () => (orders ? orders.map((o) => o._id) : undefined),
    [orders],
  );
  useNewOrderSound(orderIds);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header
        title="Kitchen Orders"
        theme="active"
        rightSlot={<CreateOrderButton />}
      />

      <div className="border-b border-neutral-200 bg-white px-3 py-3 sm:px-6 sm:py-4">
        <Link
          href="/form-dashboard"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-700 bg-emerald-700 px-4 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 sm:px-5 sm:py-3 sm:text-base"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Form Dashboard
        </Link>
      </div>

      <main className="flex-1 bg-white p-3 sm:p-6">
        {orders === undefined ? (
          <LoadingState />
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-neutral-500">
      Loading orders...
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-xl font-bold text-neutral-700 sm:text-2xl">
        No active orders
      </p>
      <p className="mt-2 text-sm text-neutral-500 sm:text-base">
        Tap the green &quot;New&quot; button to add one.
      </p>
    </div>
  );
}
