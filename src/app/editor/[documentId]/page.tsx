"use client";
import { useParams } from "next/navigation";
import { PageErrorBoundary } from "@/components/error-boundaries/page-error-boundary";
import { EditorShell } from "@/components/editor/editor-shell";

export default function DocumentEditorPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  return (
    <PageErrorBoundary pageName="Document Editor">
        <EditorShell documentId={documentId} />
    </PageErrorBoundary>
  );
}
