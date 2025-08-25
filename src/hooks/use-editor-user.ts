/**
 * useEditorUser - Manages current user data for the editor
 * 
 * @returns Current user information and stable references
 */

import { useRef, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { EditorUser } from '@/types';

export function useEditorUser() {
  const me = useQuery(api.comments.me, {}) as EditorUser | null;
  const userId = me?.userId ?? null;
  const userEmail = me?.email ?? null;

  // Keep userId in a ref to avoid editor recreation
  const userIdRef = useRef<string | null>(null);
  useEffect(() => { 
    userIdRef.current = userId;
  }, [userId]);

  return {
    me,
    userId,
    userEmail,
    userIdRef,
  };
}