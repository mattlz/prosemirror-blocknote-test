"use client";
import dynamic from "next/dynamic";
import type { ReactElement } from "react";

const EditorBody = dynamic(() => import("./editor-body").then(m => m.default ?? m.EditorBody), { ssr: false });

export function EditorShell({ documentId, readOnly = false, hideControls }: { documentId?: string | null; readOnly?: boolean; hideControls?: { back?: boolean; insert?: boolean; comments?: boolean; options?: boolean; presence?: boolean; share?: boolean } }): ReactElement {
  return <EditorBody documentId={documentId ?? null} readOnly={readOnly} hideControls={hideControls} /> as any;
}

export default EditorShell;


