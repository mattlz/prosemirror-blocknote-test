"use client";
import type { ReactElement } from "react";
import { SidebarOpenButton } from "@/components/layout";
import { PageSidebar } from "@/components/sidebar";

// This component is intentionally a placeholder for future decomposition of the
// left navigation + controls. It is not wired yet to avoid changing DOM.
// Keep markup identical when we migrate content from EditorBody.
export function EditorSidebar(): ReactElement {
  return <></>;
}

export default EditorSidebar;

