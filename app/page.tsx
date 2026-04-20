"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
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
