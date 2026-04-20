"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { XIcon } from "./icons";

type Props = {
  onClose: () => void;
};

const inputClass =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/20 sm:py-2.5 sm:text-base";

export function CreateOrderModal({ onClose }: Props) {
  const createOrder = useMutation(api.orders.createOrder);

  const [customerName, setCustomerName] = useState("");
  const [items, setItems] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !items.trim() || !phoneNumber.trim()) {
      setError("Please fill in customer name, items, and phone number.");
      return;
    }
    const qty =
      typeof quantity === "number" ? quantity : parseInt(String(quantity), 10);
    if (!qty || qty < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    setSubmitting(true);
    try {
      await createOrder({
        customerName: customerName.trim(),
        items: items.trim(),
        quantity: qty,
        specialInstructions: specialInstructions.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-order-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 sm:px-6 sm:py-4">
          <h2 id="create-order-title" className="text-lg font-bold sm:text-xl">
            New Order
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <Field label="Customer Name" htmlFor="customerName">
            <input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={inputClass}
              placeholder="e.g. Jane Doe"
              autoFocus
            />
          </Field>

          <Field label="Items" htmlFor="items">
            <textarea
              id="items"
              value={items}
              onChange={(e) => setItems(e.target.value)}
              rows={2}
              className={`${inputClass} min-h-[56px] sm:min-h-[80px]`}
              placeholder="e.g. 2x Margherita Pizza, 1x Caesar Salad"
            />
          </Field>

          <Field label="Quantity" htmlFor="quantity">
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => {
                const v = e.target.value;
                setQuantity(v === "" ? "" : Number(v));
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Special Instructions" htmlFor="specialInstructions">
            <textarea
              id="specialInstructions"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={2}
              className={`${inputClass} min-h-[48px] sm:min-h-[60px]`}
              placeholder="e.g. No onions, extra spicy"
            />
          </Field>

          <Field label="Phone Number" htmlFor="phoneNumber">
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={inputClass}
              placeholder="e.g. +1 555 123 4567"
            />
          </Field>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 bg-white px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Confirm Order"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-semibold text-neutral-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
