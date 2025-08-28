"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * useEditorDoc — Manage editor instance refs and save lifecycle for a given docId.
 * Listens to window `doc-saved` and `doc-save-error` events emitted by the editor.
 */
export function useEditorDoc(docId: string | null) {
  const editorRef = useRef<unknown>(null);
  const [editorInstance, setEditorInstance] = useState<unknown>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveErrorAt, setSaveErrorAt] = useState<number | null>(null);

  useEffect(() => {
    type SavedDetail = { docId: string };
    const onSaved = (e: Event) => {
      const detailDocId = (e as CustomEvent<SavedDetail>).detail?.docId as string | undefined;
      if (!docId || detailDocId !== docId) return;
      setLastSavedAt(Date.now());
      setSaveErrorAt(null);
    };
    const onSaveError = (e: Event) => {
      const detailDocId = (e as CustomEvent<SavedDetail>).detail?.docId as string | undefined;
      if (!docId || detailDocId !== docId) return;
      setSaveErrorAt(Date.now());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("doc-saved", onSaved as EventListener);
      window.addEventListener("doc-save-error", onSaveError as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("doc-saved", onSaved as EventListener);
        window.removeEventListener("doc-save-error", onSaveError as EventListener);
      }
    };
  }, [docId]);

  // Periodic tick so relative time updates even without new saves
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSavedAt((v) => (v !== null ? v : v));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleEditorReady = useCallback((instance: unknown) => {
    editorRef.current = instance;
    setEditorInstance(instance);
  }, []);

  const formatRelative = useCallback((ts: number | null): string => {
    if (!ts) return "";
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  return useMemo(() => ({
    editorRef,
    editorInstance,
    handleEditorReady,
    lastSavedAt,
    saveErrorAt,
    formatRelative,
  }), [editorInstance, handleEditorReady, lastSavedAt, saveErrorAt, formatRelative]);
}
