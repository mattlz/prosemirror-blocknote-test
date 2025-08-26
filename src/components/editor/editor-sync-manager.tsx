/**
 * EditorSyncManager - Manages document synchronization and save operations
 * 
 * @remarks
 * This component handles:
 * - Manual save functionality attachment to editor
 * - Auto-save event broadcasting
 * - Version change tracking and notifications
 * 
 * Extracted from BlockNoteEditor to follow single responsibility principle
 * and improve component maintainability.
 */

import { useEffect, useRef, useCallback } from 'react';
import type { ExtendedBlockNoteEditor } from '@/types/blocknote.types';
import type { DocumentSavedEventDetail, DocumentSaveErrorEventDetail } from '@/types/blocknote.types';

interface EditorSyncManagerProps {
  /** The editor instance to attach save functionality to */
  editor: ExtendedBlockNoteEditor | null;
  /** Document ID for event broadcasting */
  docId: string;
  /** Latest synced version number */
  latestVersion: number | null;
  /** Manual save function from the sync hook */
  manualSave: (editor: ExtendedBlockNoteEditor) => Promise<void>;
}

/**
 * EditorSyncManager component that handles sync operations and events
 */
export function EditorSyncManager({
  editor,
  docId,
  latestVersion,
  manualSave,
}: EditorSyncManagerProps) {
  const lastVersionRef = useRef<number | null>(null);

  // Attach manual save method to editor instance
  const attachManualSave = useCallback(() => {
    if (!editor) return;

    editor.manualSave = async (): Promise<void> => {
      try {
        await manualSave(editor);
        
        if (typeof window !== 'undefined') {
          const detail: DocumentSavedEventDetail = {
            docId,
            ts: Date.now(),
            source: 'manual',
          };
          window.dispatchEvent(new CustomEvent('doc-saved', { detail }));
        }
      } catch (error) {
        if (typeof window !== 'undefined') {
          const detail: DocumentSaveErrorEventDetail = {
            docId,
            ts: Date.now(),
            source: 'manual',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          window.dispatchEvent(new CustomEvent('doc-save-error', { detail }));
        }
      }
    };
  }, [editor, manualSave, docId]);

  // Broadcast save events when version changes (auto-save)
  const broadcastAutoSave = useCallback(() => {
    if (typeof latestVersion !== 'number') return;
    
    if (lastVersionRef.current === null) {
      lastVersionRef.current = latestVersion;
      return;
    }
    
    if (latestVersion !== lastVersionRef.current) {
      lastVersionRef.current = latestVersion;
      
      if (typeof window !== 'undefined') {
        const detail: DocumentSavedEventDetail = {
          docId,
          version: latestVersion,
          ts: Date.now(),
          source: 'auto',
        };
        window.dispatchEvent(new CustomEvent('doc-saved', { detail }));
      }
    }
  }, [latestVersion, docId]);

  // Attach manual save when editor becomes available
  useEffect(() => {
    attachManualSave();
  }, [attachManualSave]);

  // Broadcast auto-save events on version changes
  useEffect(() => {
    broadcastAutoSave();
  }, [broadcastAutoSave]);

  // This component doesn't render anything - it only manages side effects
  return null;
}

/**
 * Hook for using editor sync events in other components
 * 
 * @param onSaved - Callback when document is saved
 * @param onSaveError - Callback when save fails
 * @returns Cleanup function
 */
export function useEditorSyncEvents(
  onSaved?: (detail: DocumentSavedEventDetail) => void,
  onSaveError?: (detail: DocumentSaveErrorEventDetail) => void
) {
  useEffect(() => {
    const handleSaved = (event: CustomEvent<DocumentSavedEventDetail>) => {
      onSaved?.(event.detail);
    };

    const handleSaveError = (event: CustomEvent<DocumentSaveErrorEventDetail>) => {
      onSaveError?.(event.detail);
    };

    if (onSaved) {
      window.addEventListener('doc-saved', handleSaved as EventListener);
    }
    
    if (onSaveError) {
      window.addEventListener('doc-save-error', handleSaveError as EventListener);
    }

    return () => {
      if (onSaved) {
        window.removeEventListener('doc-saved', handleSaved as EventListener);
      }
      if (onSaveError) {
        window.removeEventListener('doc-save-error', handleSaveError as EventListener);
      }
    };
  }, [onSaved, onSaveError]);
}