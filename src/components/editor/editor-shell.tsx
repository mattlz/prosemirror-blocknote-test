"use client";
import dynamic from "next/dynamic";
import type { ReactElement } from "react";

const EditorBody = dynamic(() => import("./editor-body").then(m => m.default ?? m.EditorBody), { ssr: false });

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

/**
 * EditorShell - Main shell component for the collaborative editor
 * 
 * @remarks
 * This component provides a wrapper around the editor with dynamic loading
 * to ensure proper client-side rendering.
 * 
 * @param props - Component props
 * @returns JSX element containing the editor
 */
export function EditorShell({ 
  documentId, 
  readOnly = false, 
  hideControls 
}: EditorShellProps): ReactElement {
  return <EditorBody documentId={documentId ?? null} readOnly={readOnly} hideControls={hideControls} />;
}

export default EditorShell;


