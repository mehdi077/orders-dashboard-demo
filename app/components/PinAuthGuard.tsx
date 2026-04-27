"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { PinAuthProvider, usePinAuth } from "./PinAuth";
import { PinLoginScreen } from "./PinLoginScreen";

const PUBLIC_PATHS = ["/form"];

function AuthGateInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { authenticated, loading } = usePinAuth();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (isPublic) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-400/30 border-t-fuchsia-300" />
      </div>
    );
  }

  if (!authenticated) return <PinLoginScreen />;

  return <>{children}</>;
}

export function PinAuthGuard({ children }: { children: ReactNode }) {
  return (
    <PinAuthProvider>
      <AuthGateInner>{children}</AuthGateInner>
    </PinAuthProvider>
  );
}
