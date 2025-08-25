/**
 * useEditorSync - Manages document synchronization with Convex
 * 
 * @param docId - Document ID to sync
 * @returns Sync utilities and manual save functionality
 */

import { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useTiptapSync } from '@convex-dev/prosemirror-sync/tiptap';
import { api } from '@/convex/_generated/api';

export function useEditorSync(docId: string) {
  const tiptapSync = useTiptapSync(api.document_sync_api, docId, { snapshotDebounceMs: 1000 });
  
  // Manual save functionality
  const latestVersion = useQuery(api.document_sync_api.latestVersion, { id: docId }) as number | null;
  const submitSnapshot = useMutation(api.document_sync_api.submitSnapshot);

  const manualSave = useCallback(async (editor: any): Promise<void> => {
    if (!editor) return;
    const pmEditor = editor?.prosemirrorEditor;
    if (!pmEditor) return;
    const version = latestVersion ?? 0;
    const docJson = pmEditor.state.doc.toJSON();
    await submitSnapshot({ id: docId, version, content: JSON.stringify(docJson) });
  }, [docId, latestVersion, submitSnapshot]);

  return {
    tiptapSync,
    latestVersion,
    manualSave,
  };
}