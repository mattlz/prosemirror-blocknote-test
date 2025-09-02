"use client";
import { useEffect } from "react";
import type { ReactElement } from "react";
import { EditorBody } from "./editor-body";

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
    <EditorBody documentId={documentId ?? null} readOnly={readOnly} hideControls={hideControls} />
  );
}

export default EditorShell;

