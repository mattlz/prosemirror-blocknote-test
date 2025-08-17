"use client";
import dynamic from "next/dynamic";
import type { ReactElement } from "react";

const EditorBody = dynamic(() => import("./editor-body").then(m => m.default ?? m.EditorBody), { ssr: false });

export function EditorShell({ documentId }: { documentId?: string | null }): ReactElement {
  return <EditorBody documentId={documentId ?? null} /> as any;
}

export default EditorShell;


