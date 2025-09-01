"use client";
import { type ReactNode, type ReactElement } from "react";

export function GlobalErrorBoundary({ children }: { children: ReactNode }): ReactElement {
  return <>{children}</>;
}
export default GlobalErrorBoundary;

