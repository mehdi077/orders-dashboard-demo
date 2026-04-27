"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type FormDoc = {
  _id: Id<"onboardingForms">;
  _creationTime: number;
  businessName: string;
  ownerFullName: string;
  shopPhoneNumber: string;
  shopAddress: string;
  businessEmail: string;
  websiteUrl?: string;
  hours: { day: string; isOpen: boolean; openTime?: string; closeTime?: string }[];
  services: { name: string }[];
  mentionPrices: boolean;
  prices?: { serviceName: string; price: string }[];
  numberOfChairs: number;
  barberNames: string[];
  staffContacts: { name: string; phoneNumber: string }[];
  submittedAt: number;
};

export default function FormDashboardPage() {
  const forms = useQuery(api.onboardingForms.list);
  const [selected, setSelected] = useState<FormDoc | null>(null);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-300/90">
            Admin
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Form Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review submitted onboarding forms
          </p>
        </div>
        <a
          href="/"
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-100 shadow-sm transition hover:bg-white/10"
        >
          Back Home
        </a>
      </header>

      {forms === undefined ? (
        <div className="flex h-[50vh] items-center justify-center text-slate-400">
          Loading forms...
        </div>
      ) : forms.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-xl font-bold text-slate-300">No forms yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Onboarding submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <button
              key={form._id}
              type="button"
              onClick={() => setSelected(form as FormDoc)}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-lg backdrop-blur transition hover:border-fuchsia-400/40 hover:bg-white/[0.07]"
            >
              <p className="text-lg font-extrabold text-white">
                {form.businessName}
              </p>
              <p className="mt-1 text-sm text-slate-400">{form.ownerFullName}</p>
              <p className="mt-1 text-xs text-slate-500">{form.shopPhoneNumber}</p>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(form.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Popup modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm py-8"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl backdrop-blur mb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 text-slate-400 transition hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-black text-white">{selected.businessName}</h3>
            <p className="text-sm text-slate-400">Submitted {new Date(selected.submittedAt).toLocaleString()}</p>

            {/* Section 1 */}
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-fuchsia-300 mb-3">Basic Business Info</h4>
              <div className="space-y-2">
                <DetailRow label="Business Name" value={selected.businessName} />
                <DetailRow label="Owner" value={selected.ownerFullName} />
                <DetailRow label="Shop Phone" value={selected.shopPhoneNumber} />
                <DetailRow label="Address" value={selected.shopAddress} />
                <DetailRow label="Email" value={selected.businessEmail} />
                {selected.websiteUrl && <DetailRow label="Website" value={selected.websiteUrl} />}
              </div>
            </div>

            {/* Section 2 */}
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-fuchsia-300 mb-3">Hours & Availability</h4>
              <div className="space-y-1">
                {selected.hours.map((h) => (
                  <div key={h.day} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-4 py-2">
                    <span className="text-sm font-medium text-white">{h.day}</span>
                    <span className="text-sm text-slate-400">
                      {h.isOpen ? `${h.openTime} – ${h.closeTime}` : "Closed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3 */}
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-fuchsia-300 mb-3">Services & Pricing</h4>
              <div className="space-y-1">
                {selected.services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-4 py-2">
                    <span className="text-sm text-white">{s.name}</span>
                    {selected.mentionPrices && selected.prices?.[i] && (
                      <span className="text-sm text-emerald-400 font-semibold">{selected.prices[i].price}</span>
                    )}
                  </div>
                ))}
                {!selected.mentionPrices && (
                  <p className="text-xs text-slate-500 mt-1">Prices not mentioned on calls</p>
                )}
              </div>
            </div>

            {/* Section 4 */}
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-fuchsia-300 mb-3">Staff & Barbers</h4>
              <DetailRow label="Chairs" value={String(selected.numberOfChairs)} />
              <div className="mt-2 space-y-1">
                {selected.barberNames.map((name, i) => (
                  <div key={i} className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm text-white">
                    {name}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5 */}
            <div className="mt-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-fuchsia-300 mb-3">Call Transfer Contacts</h4>
              <div className="space-y-1">
                {selected.staffContacts.map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-white/10 bg-white/5 px-4 py-2">
                    <span className="text-sm text-white">{c.name}</span>
                    <span className="text-sm text-slate-400">{c.phoneNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-6 w-full rounded-xl bg-fuchsia-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-fuchsia-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/5 px-4 py-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
