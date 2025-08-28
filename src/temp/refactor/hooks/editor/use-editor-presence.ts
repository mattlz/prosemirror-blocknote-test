"use client";

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
}

/**
 * useEditorPresence — presence cursors/avatars surface for a doc.
 * Skeleton implementation; replace with real presence integration.
 */
export function useEditorPresence(docId: string): {
  docId: string;
  users: PresenceUser[];
} {
  return { docId, users: [] };
}

