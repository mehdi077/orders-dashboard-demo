"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { usePinAuth } from "./PinAuth";

export function PinLoginScreen() {
  const { login, logout } = usePinAuth();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (value && index === 5 && next.every((d) => d !== "")) {
      handleSubmit(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(pin: string) {
    if (pin.length !== 6) return;

    const success = await login(pin);
    if (!success) {
      setError("Incorrect PIN");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 px-4">
      <div
        className={`w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur transition-transform ${
          shake ? "animate-[shake_0.5s_ease-in-out]" : ""
        }`}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-500/20">
            <svg
              className="h-8 w-8 text-fuchsia-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white">
            Enter PIN
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Enter your 6-digit PIN to access the dashboard
          </p>
        </div>

        <div className="mb-4 flex justify-center gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-12 rounded-xl border border-white/20 bg-white/5 text-center text-2xl font-black text-white outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30"
            />
          ))}
        </div>

        {error && (
          <p className="mb-3 text-center text-sm font-semibold text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => handleSubmit(digits.join(""))}
          disabled={digits.some((d) => d === "")}
          className="w-full rounded-xl bg-fuchsia-600 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-fuchsia-500 disabled:opacity-40 disabled:hover:bg-fuchsia-600"
        >
          Unlock
        </button>

        <button
          type="button"
          onClick={logout}
          className="mt-3 w-full rounded-xl border border-white/10 py-2 text-xs font-semibold text-slate-400 transition hover:text-white"
        >
          Locked out? Contact support
        </button>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-10px);
          }
          40% {
            transform: translateX(10px);
          }
          60% {
            transform: translateX(-6px);
          }
          80% {
            transform: translateX(6px);
          }
        }
      `}</style>
    </div>
  );
}
