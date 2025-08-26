/**
 * EditorDevLogger - Development logging for editor state and transactions
 * 
 * @remarks
 * This component handles:
 * - TipTap sync state change logging
 * - ProseMirror transaction logging
 * - Development-only debugging information
 * 
 * Only active in development mode. In production builds, this component
 * does nothing to avoid performance overhead and console spam.
 */

import { useEffect } from 'react';
import type { ExtendedBlockNoteEditor, TiptapSyncState, ProseMirrorTransaction } from '@/types/blocknote.types';

interface EditorDevLoggerProps {
  /** Document ID for log context */
  docId: string;
  /** Editor instance to monitor */
  editor: ExtendedBlockNoteEditor | null;
  /** TipTap sync state to monitor */
  syncState: TiptapSyncState;
  /** Whether to enable transaction logging */
  logTransactions?: boolean;
  /** Whether to enable sync state logging */
  logSyncState?: boolean;
}

/**
 * EditorDevLogger component for development debugging
 */
export function EditorDevLogger({
  docId,
  editor,
  syncState,
  logTransactions = true,
  logSyncState = true,
}: EditorDevLoggerProps) {
  // Only run in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log TipTap sync state changes
  useEffect(() => {
    if (!isDevelopment || !logSyncState) return;

    console.log('🔄 TIPTAP SYNC STATE CHANGED:', {
      docId,
      isLoading: syncState.isLoading,
      hasInitialContent: syncState.initialContent !== null,
      initialContentLength: syncState.initialContent ? 
        JSON.stringify(syncState.initialContent).length : 0,
      timestamp: new Date().toISOString(),
    });
  }, [isDevelopment, logSyncState, docId, syncState.isLoading, syncState.initialContent]);

  // Log ProseMirror transactions
  useEffect(() => {
    if (!isDevelopment || !logTransactions || !editor) return;

    const prosemirrorEditor = editor.prosemirrorEditor;
    if (!prosemirrorEditor) return;

    const handleTransaction = (transaction: ProseMirrorTransaction) => {
      if (transaction.docChanged) {
        console.log('📝 EDITOR TRANSACTION:', {
          docId,
          stepCount: transaction.steps.length,
          stepTypes: transaction.steps.map((s) => s.stepType || 'unknown'),
          timestamp: new Date().toISOString(),
          docSize: transaction.doc.content.size,
        });
      }
    };

    prosemirrorEditor.on('transaction', handleTransaction);
    console.log('🎧 EDITOR TRANSACTION LISTENER ATTACHED:', { docId });

    return () => {
      prosemirrorEditor.off('transaction', handleTransaction);
      console.log('🎧 EDITOR TRANSACTION LISTENER REMOVED:', { docId });
    };
  }, [isDevelopment, logTransactions, editor, docId]);

  // This component doesn't render anything in production
  if (!isDevelopment) {
    return null;
  }

  // This component doesn't render anything - it only manages logging
  return null;
}

/**
 * Hook for development logging utilities
 * 
 * @param enabled - Whether logging is enabled
 * @returns Logging utility functions
 */
export function useDevLogger(enabled: boolean = process.env.NODE_ENV === 'development') {
  return {
    log: enabled ? console.log : () => {},
    warn: enabled ? console.warn : () => {},
    error: enabled ? console.error : () => {},
    debug: enabled ? console.debug : () => {},
    group: enabled ? console.group : () => {},
    groupEnd: enabled ? console.groupEnd : () => {},
    time: enabled ? console.time : () => {},
    timeEnd: enabled ? console.timeEnd : () => {},
  };
}

/**
 * Performance monitoring hook for editor operations
 * 
 * @param operationName - Name of the operation to monitor
 * @param dependency - Dependency to trigger measurement
 */
export function usePerformanceMonitor(operationName: string, dependency: unknown) {
  const { time, timeEnd } = useDevLogger();

  useEffect(() => {
    time(operationName);
    return () => {
      timeEnd(operationName);
    };
  }, [operationName, dependency, time, timeEnd]);
}