/**
 * EditorPresenceManager - Manages real-time user presence in collaborative editing
 * 
 * @remarks
 * This component handles:
 * - Heartbeat broadcasting for user presence
 * - Cursor position tracking
 * - User name and color management
 * 
 * Extracted from BlockNoteEditor to separate presence concerns and improve
 * component organization following single responsibility principle.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import { api } from '@/convex/_generated/api';
import type { ExtendedBlockNoteEditor } from '@/types/blocknote.types';

interface EditorPresenceManagerProps {
  /** Document ID for presence tracking */
  docId: string;
  /** The editor instance to track cursor position */
  editor: ExtendedBlockNoteEditor | null;
  /** Current user email for display name */
  userEmail: string | null;
  /** Heartbeat interval in milliseconds */
  heartbeatInterval?: number;
}

/**
 * EditorPresenceManager component that broadcasts user presence
 */
export function EditorPresenceManager({
  docId,
  editor,
  userEmail,
  heartbeatInterval = 1000,
}: EditorPresenceManagerProps) {
  const token = useAuthToken();
  const heartbeat = useMutation(api.presence.heartbeat);
  
  // Stable refs for presence data to avoid re-creating intervals
  const colorRef = useRef<string>(`hsl(${Math.floor(Math.random() * 360)} 70% 45%)`);
  const nameRef = useRef<string>('User');

  // Update display name when user email becomes available
  const updateDisplayName = useCallback(() => {
    if (userEmail && nameRef.current === 'User') {
      nameRef.current = userEmail;
    }
  }, [userEmail]);

  // Broadcast presence heartbeat
  const broadcastPresence = useCallback(() => {
    if (!token || !editor) return;

    const color = colorRef.current;
    const name = nameRef.current;
    const pos = editor.prosemirrorState?.selection?.head ?? 0;

    heartbeat({ 
      docId, 
      cursor: String(pos), 
      name, 
      color 
    }).catch((error) => {
      // Silently handle heartbeat errors to avoid console spam
      // In production, you might want to log this to an error service
      console.debug('Heartbeat failed:', error);
    });
  }, [token, editor, docId, heartbeat]);

  // Update display name when email changes
  useEffect(() => {
    updateDisplayName();
  }, [updateDisplayName]);

  // Set up presence heartbeat
  useEffect(() => {
    if (!token || !editor) return;

    let active = true;
    const interval = setInterval(() => {
      if (active) {
        broadcastPresence();
      }
    }, heartbeatInterval);

    // Broadcast immediately when starting
    broadcastPresence();

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token, editor, broadcastPresence, heartbeatInterval]);

  // This component doesn't render anything - it only manages side effects
  return null;
}

/**
 * Hook for managing presence colors and names
 * 
 * @param userEmail - Current user email
 * @param customColor - Optional custom color override
 * @returns Presence display data
 */
export function usePresenceDisplay(userEmail: string | null, customColor?: string) {
  const colorRef = useRef<string>(
    customColor ?? `hsl(${Math.floor(Math.random() * 360)} 70% 45%)`
  );
  const nameRef = useRef<string>('User');

  useEffect(() => {
    if (userEmail && nameRef.current === 'User') {
      nameRef.current = userEmail;
    }
  }, [userEmail]);

  return {
    color: colorRef.current,
    name: nameRef.current,
    colorRef,
    nameRef,
  };
}