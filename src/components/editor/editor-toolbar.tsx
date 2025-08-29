"use client";
import type { ReactElement } from "react";
import type { CustomBlockNoteEditor } from "@/components/editor/custom-blocks/custom-schema";
import { TopBar } from "@/components/layout";

interface EditorToolbarProps {
  documentTitle: string;
  docId: string | null;
  documentId: string | null;
  readOnly: boolean;
  commentsOpen: boolean;
  optionsOpen: boolean;
  onToggleComments: () => void;
  onToggleOptions: () => void;
  editor: { manualSave?: () => Promise<void> } | CustomBlockNoteEditor | null;
  theme: "light" | "dark";
}

export function EditorToolbar(props: EditorToolbarProps): ReactElement {
  const { documentTitle, docId, documentId, readOnly, commentsOpen, optionsOpen, onToggleComments, onToggleOptions, editor, theme } = props;
  return (
    <TopBar
      documentTitle={documentTitle}
      docId={docId}
      documentId={documentId}
      readOnly={readOnly}
      onToggleComments={onToggleComments}
      commentsOpen={commentsOpen}
      optionsOpen={optionsOpen}
      onToggleOptions={onToggleOptions}
      editor={readOnly ? null : editor}
      theme={theme}
    />
  );
}

export default EditorToolbar;
