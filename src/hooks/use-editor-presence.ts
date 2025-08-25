/**
 * useEditorPresence - Manages real-time presence for collaborative editing
 * 
 * @param docId - Document ID to track presence for
 * @returns Presence data and utilities for remote cursors
 */

import { useRef, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { PresenceData } from '@/types';

export function useEditorPresence(docId: string) {
  const presence = (useQuery(api.presence.list, { docId }) ?? []) as PresenceData[];
  
  // Keep latest presence in a ref so the plugin can read it without recreating the editor
  const presenceRef = useRef<PresenceData[]>(presence);
  useEffect(() => { 
    presenceRef.current = presence;
  }, [presence]);

  // Create a map of user presence data for easy lookup
  const presenceMap = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {};
    for (const p of presence) {
      map[p.userId] = { name: p.name, color: p.color };
    }
    return map;
  }, [presence]);

  const presenceMapRef = useRef<Record<string, { name: string; color: string }>>({});
  useEffect(() => { 
    presenceMapRef.current = presenceMap; 
  }, [presenceMap]);

  return {
    presence,
    presenceRef,
    presenceMap,
    presenceMapRef,
  };
}