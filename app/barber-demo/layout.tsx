import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barber Demo",
  description: "Barber shop calendar booking demo",
};

export default function BarberDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 text-slate-100">
      {children}
    </div>
  );
}
