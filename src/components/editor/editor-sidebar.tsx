"use client";
import type { ReactElement } from "react";
import { PageSidebar } from "@/components/editor/sidebar";

interface EditorSidebarProps {
  sidebarOpen: boolean;
  documentId: string | null;
  pageDocId: string | null;
  onSelect: (id: string) => void;
  onCreatePage: () => void;
  onCollapse: () => void;
  theme: "light" | "dark";
  lastSavedAt: number | null;
  saveErrorAt: number | null;
  formatRelative: (ts: number | null) => string;
}

export function EditorSidebar(props: EditorSidebarProps): ReactElement {
  const { sidebarOpen, documentId, pageDocId, onSelect, onCreatePage, onCollapse, theme, lastSavedAt, saveErrorAt, formatRelative } = props;
  return (
    <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
      <div className={`h-full transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full relative">
          <PageSidebar documentId={documentId} activePageDocId={pageDocId} onSelect={onSelect} onCreatePage={onCreatePage} onCollapse={onCollapse} theme={theme} />
          <div className="absolute left-2 right-2 bottom-2 text-[11px] text-neutral-500">
            {saveErrorAt ? (
              <div className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-red-700">Save failed. Retrying…</div>
            ) : (
              <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1">
                {lastSavedAt ? `Last saved ${formatRelative(lastSavedAt)}` : "Waiting for first save…"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorSidebar;
