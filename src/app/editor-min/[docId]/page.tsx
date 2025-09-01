"use client";
import { useParams } from "next/navigation";
import EditorShell from "@/components/editor/editor-shell";

export default function EditorMinPage() {
  const params = useParams();
  const docId = params.docId as string;
  // Render editor with minimal wrappers to confirm single mount
  return <EditorShell documentId={docId} />;
}

