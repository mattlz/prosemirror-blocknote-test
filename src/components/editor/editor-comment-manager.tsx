/**
 * EditorCommentManager - Manages comment highlighting and thread synchronization
 * 
 * @remarks
 * This component handles:
 * - Visual highlighting of blocks with comments
 * - Synchronization of comment threads with ConvexThreadStore
 * - DOM manipulation for comment indicators
 * 
 * Extracted from BlockNoteEditor to separate comment management concerns
 * and improve component maintainability.
 */

import { useEffect, useRef, useMemo } from 'react';
import type { ThreadData, CommentThreadStore } from '@/types/blocknote.types';

interface EditorCommentManagerProps {
  /** All comment threads for the current document */
  threads: ThreadData[];
  /** Thread store for managing comment state */
  threadStore: CommentThreadStore;
  /** Editor instance (used for validation) */
  editor: unknown;
}

/**
 * EditorCommentManager component that handles comment visualization and sync
 */
export function EditorCommentManager({
  threads,
  threadStore,
  editor,
}: EditorCommentManagerProps) {
  const lastMarkedRef = useRef<Set<string>>(new Set());

  // Memoize the set of block IDs that have comments
  const blocksWithComments = useMemo(() => {
    return new Set(threads.map((thread) => thread.thread.blockId));
  }, [threads]);

  // Update thread store with latest data from Convex
  useEffect(() => {
    if (!threadStore || !threads) return;
    
    try {
      threadStore.setThreadsFromConvex(threads as ThreadData[]);
    } catch (error) {
      console.warn('Failed to sync threads to store:', error);
    }
  }, [threads, threadStore]);

  // Update visual comment indicators in the DOM
  useEffect(() => {
    if (!editor) return;

    const current = blocksWithComments;
    const previous = lastMarkedRef.current;

    // Remove comment markers from blocks that no longer have comments
    for (const oldId of Array.from(previous)) {
      if (!current.has(oldId)) {
        removeCommentMarker(oldId);
        previous.delete(oldId);
      }
    }

    // Add comment markers to blocks with new comments
    for (const blockId of Array.from(current)) {
      if (!previous.has(blockId)) {
        addCommentMarker(blockId);
        previous.add(blockId);
      }
    }

    lastMarkedRef.current = previous;
  }, [blocksWithComments, editor]);

  // This component doesn't render anything - it only manages side effects
  return null;
}

/**
 * Add visual comment marker to a block element
 * 
 * @param blockId - Block ID to mark
 */
function addCommentMarker(blockId: string): void {
  const element = findBlockElement(blockId);
  if (element) {
    element.setAttribute('data-has-comment', '1');
  }
}

/**
 * Remove visual comment marker from a block element
 * 
 * @param blockId - Block ID to unmark
 */
function removeCommentMarker(blockId: string): void {
  const element = findBlockElement(blockId);
  if (element) {
    element.removeAttribute('data-has-comment');
  }
}

/**
 * Find a block element in the DOM using various selector strategies
 * 
 * @param blockId - Block ID to find
 * @returns DOM element if found, null otherwise
 */
function findBlockElement(blockId: string): HTMLElement | null {
  // Try multiple selector strategies as BlockNote may use different attributes
  const selectors = [
    `[data-id="${blockId}"]`,
    `[data-block-id="${blockId}"]`,
    `[data-node-id="${blockId}"]`,
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element) {
      return element;
    }
  }

  return null;
}

/**
 * Hook for managing comment-related CSS classes and styles
 * 
 * @returns CSS classes for comment indicators
 */
export function useCommentStyles() {
  return useMemo(() => ({
    hasComment: 'has-comment',
    commentIndicator: 'comment-indicator',
    commentHighlight: 'comment-highlight',
    resolvedComment: 'comment-resolved',
  }), []);
}

/**
 * Hook for comment thread operations
 * 
 * @param threadStore - Thread store instance
 * @returns Thread operation functions
 */
export function useCommentOperations(threadStore: CommentThreadStore | null) {
  return useMemo(() => {
    if (!threadStore) {
      return {
        getThreads: () => new Map(),
        getThread: () => null,
      };
    }

    return {
      getThreads: () => threadStore.getThreads(),
      getThread: (threadId: string) => {
        try {
          return threadStore.getThread(threadId);
        } catch {
          return null;
        }
      },
    };
  }, [threadStore]);
}