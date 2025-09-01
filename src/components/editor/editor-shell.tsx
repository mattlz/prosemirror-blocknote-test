"use client";
import { Suspense, useEffect } from "react";
import type { ReactElement } from "react";
import { EditorBody } from "./editor-body";

function EditorLoading() {
  return <div className="p-6 text-neutral-500">Preparing editor…</div>;
}

interface EditorShellProps {
  documentId?: string | null;
  readOnly?: boolean;
  hideControls?: {
    back?: boolean;
    insert?: boolean;
    comments?: boolean;
    options?: boolean;
    presence?: boolean;
    share?: boolean;
  };
}

export function EditorShell({ documentId, readOnly = false, hideControls }: EditorShellProps): ReactElement {
  useEffect(() => {
    console.log("[EditorShell] mount", { documentId });
    return () => console.log("[EditorShell] unmount", { documentId });
  }, [documentId]);

  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorBody documentId={documentId ?? null} readOnly={readOnly} hideControls={hideControls} />
    </Suspense>
  );
}

export default EditorShell;

