"use client";
import { type ReactNode, type ReactElement } from "react";

export function PageErrorBoundary({ children, pageName }: { children: ReactNode; pageName: string }): ReactElement {
  return <>{children}</>;
}
export default PageErrorBoundary;

