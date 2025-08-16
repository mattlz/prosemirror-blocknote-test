"use client";
import dynamic from "next/dynamic";
import type { ReactElement } from "react";

const Editor = dynamic(() => import("./editor"), { ssr: false });

export default function EditorShell({ documentId }: { documentId?: string | null }): ReactElement {
  return <Editor documentId={documentId ?? null} /> as any;
}


