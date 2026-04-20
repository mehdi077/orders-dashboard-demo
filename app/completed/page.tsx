"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Header } from "../components/Header";
import { CompletedOrderCard } from "../components/CompletedOrderCard";

export default function CompletedPage() {
  const orders = useQuery(api.orders.listCompleted);

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <Header title="Completed Orders" theme="completed" />

      <main className="flex-1 bg-slate-900 p-3 sm:p-6">
        {orders === undefined ? (
          <div className="flex h-[60vh] items-center justify-center text-slate-400">
            Loading completed orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex h-[60vh] flex-col items-center justify-center px-4 text-center">
            <p className="text-xl font-bold text-slate-200 sm:text-2xl">
              No completed orders yet
            </p>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Finished orders will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map((order) => (
              <CompletedOrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
