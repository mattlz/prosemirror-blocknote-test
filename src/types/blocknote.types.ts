/**
 * BlockNote and editor integration type definitions
 * Provides comprehensive typing for BlockNote editor, sync, and collaboration features
 */

import type { BlockNoteEditor } from '@blocknote/core';
import type { Extension } from '@tiptap/core';
import type { Transaction, EditorState } from 'prosemirror-state';
import type { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import type { Step } from 'prosemirror-transform';
import type { CustomBlockNoteEditor } from '@/components/editor/custom-blocks/custom-schema';
import type { ThreadData, PresenceUser } from './editor.types';

/**
 * TipTap sync extension interface
 */
export interface TiptapSyncExtension extends Extension {
  name: 'prosemirror-sync';
  storage: Record<string, unknown>;
}

/**
 * TipTap sync state
 */
export interface TiptapSyncState {
  /** The TipTap sync extension instance */
  extension: TiptapSyncExtension | null;
  /** Whether the sync is currently loading */
  isLoading: boolean;
  /** Initial content snapshot from the server */
  initialContent: unknown;
  /** Function to create a new document */
  create?: ((content: any) => Promise<void>) | undefined;
}

/**
 * Editor sync result from useEditorSync hook
 */
export interface EditorSyncResult {
  /** TipTap sync state and extension */
  tiptapSync: TiptapSyncState;
  /** Latest synchronized version number */
  latestVersion: number | null;
  /** Manual save function */
  manualSave: (editor: CustomBlockNoteEditor) => Promise<void>;
}

/**
 * Editor presence result from useEditorPresence hook
 */
export interface EditorPresenceResult {
  /** Current presence data for all users */
  presence: PresenceUser[];
  /** Ref to presence data for stable access */
  presenceRef: React.MutableRefObject<PresenceUser[]>;
  /** Map of user IDs to presence data */
  presenceMapRef: React.MutableRefObject<Record<string, PresenceUser>>;
}

/**
 * Editor user result from useEditorUser hook
 */
export interface EditorUserResult {
  /** Current user ID */
  userId: string | null;
  /** Current user email */
  userEmail: string | null;
  /** Ref to user ID for stable access */
  userIdRef: React.MutableRefObject<string | null>;
}

/**
 * Editor comments result from useEditorComments hook
 */
export interface EditorCommentsResult {
  /** All threads for the current document */
  threadsForDoc: ThreadData[];
  /** Thread store for managing comments */
  threadStore: CommentThreadStore;
}

/**
 * Comment thread store interface
 */
export interface CommentThreadStore {
  /** Set threads from Convex data */
  setThreadsFromConvex: (threads: ThreadData[]) => void;
  /** Get all threads */
  getThreads: () => ThreadData[];
  /** Add a new thread */
  addThread: (thread: ThreadData) => void;
  /** Remove a thread by ID */
  removeThread: (threadId: string) => void;
  /** Update a thread */
  updateThread: (threadId: string, updates: Partial<ThreadData>) => void;
}

/**
 * ProseMirror transaction with additional typing
 */
export interface ProseMirrorTransaction extends Transaction {
  /** Whether the document was changed */
  docChanged: boolean;
  /** The document after applying the transaction */
  doc: ProseMirrorNode;
  /** Steps applied in this transaction */
  steps: ProseMirrorStep[];
}

/**
 * ProseMirror step with type information
 */
export interface ProseMirrorStep extends Step {
  /** Type of the step */
  stepType?: string;
}

/**
 * ProseMirror editor instance
 */
export interface ProseMirrorEditor {
  /** Current editor state */
  state: EditorState;
  /** Schema used by the editor */
  schema: Schema;
  /** Subscribe to transactions */
  on(event: 'transaction', handler: (tr: ProseMirrorTransaction) => void): void;
  /** Unsubscribe from transactions */
  off(event: 'transaction', handler: (tr: ProseMirrorTransaction) => void): void;
}

/**
 * Extended BlockNote editor with custom functionality
 */
export interface ExtendedBlockNoteEditor extends Omit<CustomBlockNoteEditor, 'prosemirrorState'> {
  /** Manual save function attached to the editor instance */
  manualSave?: () => Promise<void>;
  /** ProseMirror editor instance */
  prosemirrorEditor?: ProseMirrorEditor;
  /** Current ProseMirror state */
  prosemirrorState?: EditorState;
  /** ProseMirror schema */
  pmSchema: Schema;
}

/**
 * User resolver result
 */
export interface ResolvedUser {
  /** User ID */
  id: string;
  /** Display name */
  username: string;
  /** Avatar URL (can be empty) */
  avatarUrl: string;
}

/**
 * User resolver function type
 */
export type UserResolver = (userIds: string[]) => Promise<ResolvedUser[]>;

/**
 * Editor creation options for BlockNote
 */
export interface BlockNoteCreateOptions {
  /** Schema to use for the editor */
  schema: unknown;
  /** Function to resolve user information */
  resolveUsers: UserResolver;
  /** Comments configuration */
  comments?: {
    threadStore: CommentThreadStore;
  };
  /** TipTap options for extensions */
  _tiptapOptions?: {
    extensions: Extension[];
  };
  /** Additional extensions */
  _extensions?: {
    remoteCursors: () => {
      plugin: unknown;
    };
  };
  /** Initial content blocks */
  initialContent?: unknown[];
  /** Whether to create a headless editor */
  _headless?: boolean;
}

/**
 * Editor sync configuration
 */
export interface EditorSyncConfig {
  /** Debounce time for snapshot updates in milliseconds */
  snapshotDebounceMs: number;
  /** Whether to enable auto-save */
  autoSave: boolean;
  /** Maximum retry attempts for sync operations */
  maxRetries: number;
}

/**
 * Document saved event detail
 */
export interface DocumentSavedEventDetail {
  /** Document ID */
  docId: string;
  /** Version number (if available) */
  version?: number;
  /** Timestamp of save */
  ts: number;
  /** Source of the save (manual or auto) */
  source: 'manual' | 'auto';
}

/**
 * Document save error event detail
 */
export interface DocumentSaveErrorEventDetail {
  /** Document ID */
  docId: string;
  /** Timestamp of error */
  ts: number;
  /** Source of the save attempt */
  source: 'manual' | 'auto';
  /** Error message (if available) */
  error?: string;
}

/**
 * Custom event map for document events
 */
declare global {
  interface WindowEventMap {
    'doc-saved': CustomEvent<DocumentSavedEventDetail>;
    'doc-save-error': CustomEvent<DocumentSaveErrorEventDetail>;
  }
}

/**
 * Type guard to check if value is a ProseMirrorNode
 */
export function isProseMirrorNode(value: unknown): value is ProseMirrorNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'nodeSize' in value
  );
}

/**
 * Type guard to check if editor has ProseMirror instance
 */
export function hasProseMirrorEditor(editor: unknown): editor is { prosemirrorEditor: ProseMirrorEditor } {
  return (
    typeof editor === 'object' &&
    editor !== null &&
    'prosemirrorEditor' in editor
  );
}

/**
 * Type guard for presence user data
 */
export function isPresenceUser(value: unknown): value is PresenceUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'name' in value &&
    'color' in value
  );
}

// Re-export needed types
export type { PresenceUser, ThreadData } from './editor.types';