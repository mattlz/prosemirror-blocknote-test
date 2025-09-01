"use client";
import { ReactNode, useMemo, type ReactElement } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

const DEFAULT_CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3210";

export function ConvexProvider({ children }: { children: ReactNode }): ReactElement {
  const client = useMemo(() => new ConvexReactClient(DEFAULT_CONVEX_URL), []);
  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}

// Backward-compatible export for existing imports (safe alias)
export const Providers = ConvexProvider;

