"use client";
import type { ReactNode, ReactElement } from "react";

// Stubbed ThemeProvider: passthrough to avoid extra deps
export function ThemeProvider({ children }: { children: ReactNode }): ReactElement {
  return <>{children}</>;
}

