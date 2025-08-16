"use client";
import dynamic from "next/dynamic";
import type { ReactElement } from "react";

const Editor = dynamic(() => import("./editor"), { ssr: false });

export default function EditorShell(): ReactElement {
  return <Editor />;
}


