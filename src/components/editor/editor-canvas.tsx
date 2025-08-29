"use client";
import type { ReactElement } from "react";
import { BlockNoteEditor } from "@/components/editor";
import { IconPicker } from "@/components/editor/sidebar";

interface EditorCanvasProps {
  theme: "light" | "dark";
  pageWidth: "default" | "full";
  currentPageTitle: string;
  pageDocId: string;
  showCursorLabels: boolean;
  editable: boolean;
  iconValue: string | null;
  onIconChange: (val: string | null) => void;
  onEditorReady: (instance: unknown) => void;
}

export function EditorCanvas(props: EditorCanvasProps): ReactElement {
  const { theme, pageWidth, currentPageTitle, pageDocId, showCursorLabels, editable, iconValue, onIconChange, onEditorReady } = props;
  return (
    <div className={`h-full overflow-auto p-6 ${theme === "dark" ? "bg-neutral-900 text-neutral-100" : "bg-white text-neutral-900"}`}>
      <div className={pageWidth === "full" ? "w-full max-w-none" : "mx-auto w-full max-w-[1000px]"}>
        <div className="mt-4 mb-4 flex items-center gap-3">
          <IconPicker theme={theme} value={iconValue} onChange={onIconChange} />
          <h1 className="text-5xl font-extrabold tracking-tight">{currentPageTitle || "Untitled"}</h1>
        </div>
        <BlockNoteEditor
          docId={pageDocId}
          showCursorLabels={showCursorLabels}
          editable={editable}
          theme={theme}
          onEditorReady={onEditorReady}
        />
      </div>
    </div>
  );
}

export default EditorCanvas;
