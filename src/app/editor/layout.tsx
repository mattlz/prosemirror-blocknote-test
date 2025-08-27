"use client";
import { AuthGuard } from "@/components/auth/auth-guard";

/**
 * EditorLayout - Layout specifically for the editor experience
 * 
 * @remarks
 * This layout is separate from the dashboard to provide a focused editing experience
 * without the dashboard navigation and sidebar.
 */
export default function EditorLayout({ 
  children 
}: { 
  children: React.ReactNode 
}): React.ReactNode {
  return (
    <AuthGuard>
      <div className="h-screen w-full">
        {children}
      </div>
    </AuthGuard>
  );
}