import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexProvider } from "@/providers/convex-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import GlobalErrorBoundary from "@/components/error-boundaries/global-error-boundary";
import ErrorMonitoringInitializer from "@/components/error-monitoring-initializer";

export const metadata: Metadata = {
  title: "Collaborative Editor",
  description: "Docs with Convex + BlockNote",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <GlobalErrorBoundary>
            <ErrorMonitoringInitializer />
            <ConvexProvider>
              <ThemeProvider>
                {children}
                <Toaster />
              </ThemeProvider>
            </ConvexProvider>
          </GlobalErrorBoundary>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
