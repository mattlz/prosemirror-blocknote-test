/**
 * Comments system type definitions
 */

import type { Id } from '@/convex/_generated/dataModel';

/**
 * Comment thread structure
 */
export interface CommentThread {
  _id: Id<"commentThreads">;
  docId: string;
  blockId: string;
  createdAt: number;
  resolved?: boolean;
  creatorId?: string;
  updatedAt?: number;
}

/**
 * Individual comment structure
 */
export interface Comment {
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
 * Comment with thread data for display
 */
export interface CommentWithThread {
  thread: CommentThread;
  comments: Comment[];
}

/**
 * Comment body content (for BlockNote comments)
 */
export interface CommentBody {
  type: 'doc';
  content: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{
        type: string;
        attrs?: Record<string, unknown>;
      }>;
    }>;
    attrs?: Record<string, unknown>;
  }>;
}

/**
 * Comment creation parameters
 */
export interface CreateCommentParams {
  docId: string;
  blockId: string;
  content: string;
  threadId?: string;
  parentCommentId?: string;
}

/**
 * Comment update parameters
 */
export interface UpdateCommentParams {
  commentId: Id<"comments">;
  content: string;
}

/**
 * Thread resolution parameters
 */
export interface ResolveThreadParams {
  threadId: Id<"commentThreads">;
  resolved: boolean;
}

/**
 * User information for comments
 */
export interface CommentAuthor {
  id: string;
  username: string;
  avatarUrl?: string;
  email?: string;
}

/**
 * Comment store interface for thread management
 */
export interface CommentStore {
  threads: Map<string, CommentWithThread>;
  setThreadsFromConvex(rows: Array<{ thread: CommentThread; comments: Comment[] }>): void;
  createThread(options: { initialComment: { body: CommentBody; metadata?: Record<string, unknown> }; metadata?: Record<string, unknown> }): Promise<CommentWithThread>;
  addComment(options: { comment: { body: CommentBody; metadata?: Record<string, unknown> }; threadId: string }): Promise<Comment>;
  updateComment(options: { comment: { body: CommentBody; metadata?: Record<string, unknown> }; threadId: string; commentId: string }): Promise<void>;
  deleteComment(commentId: string): Promise<void>;
  resolveThread(threadId: string, resolved: boolean): Promise<void>;
}