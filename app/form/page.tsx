"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    const label = `${hour12}:${m === 0 ? "00" : m} ${ampm}`;
    TIME_OPTIONS.push(label);
  }
}

type DayHours = {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
};

type ServiceEntry = { name: string };
type PriceEntry = { serviceName: string; price: string };
type StaffContact = { name: string; phoneNumber: string };

const defaultHours: DayHours[] = DAYS.map((day) => ({
  day,
  isOpen: day !== "Sunday",
  openTime: "9:00 AM",
  closeTime: "6:00 PM",
}));

export default function OnboardingFormPage() {
  // Section 1
  const [businessName, setBusinessName] = useState("");
  const [ownerFullName, setOwnerFullName] = useState("");
  const [shopPhoneNumber, setShopPhoneNumber] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Section 2
  const [hours, setHours] = useState<DayHours[]>(defaultHours);

  // Section 3
  const [services, setServices] = useState<ServiceEntry[]>([{ name: "" }]);
  const [mentionPrices, setMentionPrices] = useState(false);
  const [prices, setPrices] = useState<PriceEntry[]>([]);

  // Section 4
  const [numberOfChairs, setNumberOfChairs] = useState("1");
  const [barberNames, setBarberNames] = useState<string[]>([""]);

  // Section 5
  const [staffContacts, setStaffContacts] = useState<StaffContact[]>([
    { name: "", phoneNumber: "" },
  ]);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitForm = useMutation(api.onboardingForms.submit);

  function updateHours(index: number, patch: Partial<DayHours>) {
    setHours((prev) =>
      prev.map((h, i) => (i === index ? { ...h, ...patch } : h)),
    );
  }

  function addService() {
    setServices((prev) => [...prev, { name: "" }]);
    if (mentionPrices) {
      setPrices((prev) => [...prev, { serviceName: "", price: "" }]);
    }
  }

  function updateService(index: number, name: string) {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { name } : s)),
    );
  }

  function removeService(index: number) {
    setServices((prev) => prev.filter((_, i) => i !== index));
    setPrices((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePrice(index: number, price: string) {
    setPrices((prev) =>
      prev.map((p, i) => (i === index ? { ...p, price } : p)),
    );
  }

  function updateBarber(index: number, name: string) {
    setBarberNames((prev) =>
      prev.map((b, i) => (i === index ? name : b)),
    );
  }

  function addBarber() {
    setBarberNames((prev) => [...prev, ""]);
  }

  function removeBarber(index: number) {
    setBarberNames((prev) => prev.filter((_, i) => i !== index));
  }

  function addStaffContact() {
    setStaffContacts((prev) => [...prev, { name: "", phoneNumber: "" }]);
  }

  function updateStaffContact(
    index: number,
    field: "name" | "phoneNumber",
    value: string,
  ) {
    setStaffContacts((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function removeStaffContact(index: number) {
    setStaffContacts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const filledServices = services.filter((s) => s.name.trim());
    const filledBarbers = barberNames.filter((b) => b.trim());
    const filledContacts = staffContacts.filter(
      (c) => c.name.trim() && c.phoneNumber.trim(),
    );

    if (
      !businessName.trim() ||
      !ownerFullName.trim() ||
      !shopPhoneNumber.trim() ||
      !shopAddress.trim() ||
      !businessEmail.trim()
    ) {
      setError("Please fill in all required fields in Section 1.");
      return;
    }

    if (filledBarbers.length === 0) {
      setError("Please add at least one barber name in Section 4.");
      return;
    }

    const chairsNum = parseInt(numberOfChairs) || 0;
    if (chairsNum < 1) {
      setError("Please enter the number of chairs in Section 4.");
      return;
    }

    if (filledContacts.length === 0) {
      setError("Please add at least one call transfer contact in Section 5.");
      return;
    }

    setSubmitting(true);
    try {
      const hoursPayload = hours.map((h) => ({
        day: h.day,
        isOpen: h.isOpen,
        openTime: h.isOpen ? h.openTime : undefined,
        closeTime: h.isOpen ? h.closeTime : undefined,
      }));

      const pricesPayload = mentionPrices
        ? services
            .map((s, i) => ({
              serviceName: s.name.trim(),
              price: prices[i]?.price?.trim() ?? "",
            }))
            .filter((p) => p.serviceName)
        : undefined;

      await submitForm({
        businessName: businessName.trim(),
        ownerFullName: ownerFullName.trim(),
        shopPhoneNumber: shopPhoneNumber.trim(),
        shopAddress: shopAddress.trim(),
        businessEmail: businessEmail.trim(),
        websiteUrl: websiteUrl.trim() || undefined,
        hours: hoursPayload,
        services: filledServices.map((s) => ({ name: s.name.trim() })),
        mentionPrices,
        prices: pricesPayload,
        numberOfChairs: chairsNum,
        barberNames: filledBarbers.map((b) => b.trim()),
        staffContacts: filledContacts,
      });
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-7 w-7 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Thank You!</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your onboarding form has been submitted successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">
          Business Onboarding Form
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill out the form below to get started.
        </p>

        {error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-10">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Section 1: Basic Business Info
            </h2>
            <div className="mt-4 space-y-4">
              <Field label="Business Name *" value={businessName} onChange={setBusinessName} placeholder="e.g. Downtown Cuts" />
              <Field label="Owner's Full Name *" value={ownerFullName} onChange={setOwnerFullName} placeholder="e.g. John Smith" />
              <Field label="Shop Phone Number *" value={shopPhoneNumber} onChange={setShopPhoneNumber} placeholder="e.g. (555) 123-4567" />
              <Field label="Shop Address *" value={shopAddress} onChange={setShopAddress} placeholder="e.g. 123 Main St, City, State 12345" />
              <Field label="Business Email Address *" value={businessEmail} onChange={setBusinessEmail} placeholder="e.g. info@downtowncuts.com" type="email" />
              <Field label="Website URL" value={websiteUrl} onChange={setWebsiteUrl} placeholder="e.g. www.downtowncuts.com" />
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Section 2: Hours & Availability
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Select your operating hours for each day of the week.
            </p>
            <div className="mt-4 space-y-3">
              {hours.map((h, i) => (
                <div
                  key={h.day}
                  className="flex flex-wrap items-center gap-3 rounded border border-gray-200 px-4 py-3"
                >
                  <label className="flex items-center gap-2 min-w-[110px]">
                    <input
                      type="checkbox"
                      checked={h.isOpen}
                      onChange={(e) =>
                        updateHours(i, { isOpen: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {h.day}
                    </span>
                  </label>

                  {h.isOpen ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={h.openTime}
                        onChange={(e) =>
                          updateHours(i, { openTime: e.target.value })
                        }
                        className="rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <span className="text-sm text-gray-400">to</span>
                      <select
                        value={h.closeTime}
                        onChange={(e) =>
                          updateHours(i, { closeTime: e.target.value })
                        }
                        className="rounded border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Section 3: Services & Pricing
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              List all services you offer.
            </p>
            <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Leave this section empty if you prefer not to list services on the call.
              Instead, the assistant will offer to forward the caller to a staff member who can provide more details about services and pricing.
            </p>
            <div className="mt-4 space-y-2">
              {services.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => updateService(i, e.target.value)}
                    placeholder={`Service ${i + 1}`}
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(i)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addService}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Add another service
            </button>

            <div className="mt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={mentionPrices}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setMentionPrices(checked);
                    if (checked) {
                      setPrices(
                        services.map((s, i) => ({
                          serviceName: s.name.trim(),
                          price: prices[i]?.price ?? "",
                        })),
                      );
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-900">
                  Mention prices on the call?
                </span>
              </label>

              {mentionPrices && (
                <div className="mt-3 space-y-2 pl-6">
                  {services.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="min-w-[140px] text-sm text-gray-700">
                        {s.name.trim() || `Service ${i + 1}`}
                      </span>
                      <input
                        type="text"
                        value={prices[i]?.price ?? ""}
                        onChange={(e) => updatePrice(i, e.target.value)}
                        placeholder="e.g. $25"
                        className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Section 4: Staff & Barbers
            </h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  How many chairs do you have? *
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numberOfChairs}
                  onChange={(e) => setNumberOfChairs(e.target.value)}
                  onBlur={() => {
                    const n = parseInt(numberOfChairs);
                    if (!n || n < 1) setNumberOfChairs("1");
                  }}
                  className="mt-1 w-24 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  What are the names of the barbers?
                </label>
                <div className="mt-2 space-y-2">
                  {barberNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => updateBarber(i, e.target.value)}
                        placeholder={`Barber ${i + 1}`}
                        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
                      />
                      {barberNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBarber(i)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addBarber}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  + Add another barber
                </button>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Section 5: Call Transfer Contacts *
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Provide names and phone numbers for staff members the assistant can
              transfer calls to when a caller asks to speak with someone directly.
            </p>
            <div className="mt-4 space-y-3">
              {staffContacts.map((c, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded border border-gray-200 px-4 py-3"
                >
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) =>
                      updateStaffContact(i, "name", e.target.value)
                    }
                    placeholder="Staff name"
                    className="flex-1 min-w-[140px] rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                  <input
                    type="text"
                    value={c.phoneNumber}
                    onChange={(e) =>
                      updateStaffContact(i, "phoneNumber", e.target.value)
                    }
                    placeholder="Phone number"
                    className="flex-1 min-w-[140px] rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  />
                  {staffContacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStaffContact(i)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStaffContact}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Add another contact
            </button>
          </section>

          {/* Submit */}
          <div className="space-y-4 pb-12">
            <p className="text-sm text-gray-500 leading-relaxed">
              If you have any questions or need assistance before submitting this form, please don't hesitate to reach out. We're happy to walk you through anything not covered here. Call us directly at <a href="tel:2673012303" className="font-semibold text-gray-900 underline">267-301-2303</a>.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
      />
    </div>
  );
}
