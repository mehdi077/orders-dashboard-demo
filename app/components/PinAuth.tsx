"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";

type PinAuthState = {
  authenticated: boolean;
  pinSet: boolean | undefined;
  loading: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
};

const PinAuthContext = createContext<PinAuthState | null>(null);

const SESSION_KEY = "pin_auth_until";

export function PinAuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const convex = useConvex();

  const isPinSet = useQuery(api.pin.isPinSet);

  useEffect(() => {
    const expires = sessionStorage.getItem(SESSION_KEY);
    if (expires && Number(expires) > Date.now()) {
      setAuthenticated(true);
    }
    setInitializing(false);
  }, []);

  // Default PIN (130501) is always active, so no auto-auth flow needed

  const login = useCallback(
    async (pin: string) => {
      try {
        const result: { valid: boolean } = await convex.query(
          api.pin.verifyPin,
          { pin },
        );
        if (result.valid) {
          setAuthenticated(true);
          sessionStorage.setItem(
            SESSION_KEY,
            String(Date.now() + 4 * 60 * 60 * 1000),
          );
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [convex],
  );

  const logout = useCallback(() => {
    setAuthenticated(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <PinAuthContext.Provider
      value={{
        authenticated,
        pinSet: isPinSet,
        loading: initializing || isPinSet === undefined,
        login,
        logout,
      }}
    >
      {children}
    </PinAuthContext.Provider>
  );
}

export function usePinAuth() {
  const ctx = useContext(PinAuthContext);
  if (!ctx) throw new Error("usePinAuth must be used within PinAuthProvider");
  return ctx;
}
