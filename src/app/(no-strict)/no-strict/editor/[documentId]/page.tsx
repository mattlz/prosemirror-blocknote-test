"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { PageErrorBoundary } from "@/components/error-boundaries/page-error-boundary";
import { LazyEditorShell } from "@/lib/dynamic-imports";

function EditorSkeleton() {
  return <div className="p-6 text-neutral-500">Loading editor…</div>;
}

export default function DocumentEditorPage() {
  const params = useParams();
  const documentId = params.documentId as string;
  return (
    <PageErrorBoundary pageName="Document Editor (no-strict)">
      <Suspense fallback={<EditorSkeleton />}>
        <LazyEditorShell documentId={documentId} />
      </Suspense>
    </PageErrorBoundary>
  );
}

