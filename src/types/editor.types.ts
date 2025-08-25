/**
 * Editor-specific type definitions
 */

import type { Id } from '@/convex/_generated/dataModel';

/**
 * Presence user data for real-time collaboration
 */
export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
  cursor?: string;
  updatedAt: number;
}

/**
 * Thread data structure for comments
 */
export interface ThreadData {
  thread: {
    _id: Id<"commentThreads">;
    docId: string;
    blockId: string;
    resolved?: boolean;
    createdAt: number;
    creatorId?: string;
  };
  comments: CommentData[];
}

/**
 * Individual comment data
 */
export interface CommentData {
  _id: Id<"comments">;
  docId: string;
  blockId: string;
  threadId: Id<"commentThreads">;
  content: string;
  authorId: string;
  createdAt: number;
  updatedAt: number;
  resolved?: boolean;
  parentCommentId?: Id<"comments">;
}

/**
 * User data for authentication and presence
 */
export interface EditorUser {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Editor initialization options
 */
export interface EditorOptions {
  docId: string;
  userId: string | null;
  userEmail: string | null;
  showRemoteCursors?: boolean;
  editable?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Editor sync configuration
 */
export interface EditorSyncConfig {
  snapshotDebounceMs: number;
  initialContent: unknown;
}

/**
 * Comment operations interface
 */
export interface CommentOperations {
  createThread: (options: { docId: string; blockId: string; content: string }) => Promise<ThreadData>;
  createComment: (options: { docId: string; blockId: string; threadId: string; content: string }) => Promise<CommentData>;
  updateComment: (options: { commentId: string; content: string }) => Promise<void>;
  deleteComment: (options: { commentId: string }) => Promise<void>;
  resolveThread: (options: { threadId: string; resolved: boolean }) => Promise<void>;
}

/**
 * Remote cursor data for collaborative editing
 */
export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  position: number;
}