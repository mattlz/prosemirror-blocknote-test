"use client";
import type { Comment, Thread } from "@/types/comments.types";

export interface UseCommentThreadsOptions {
  includeResolved?: boolean;
}

export interface ThreadWithComments {
  thread: Thread;
  comments: Comment[];
}

/**
 * useCommentThreads — lists comment threads for a doc.
 * Skeleton implementation; replace with Convex queries.
 */
export function useCommentThreads(
  _docId: string,
  _opts?: UseCommentThreadsOptions
): { threads: ThreadWithComments[]; isLoading: boolean } {
  return { threads: [], isLoading: false };
}

/**
 * useCommentThread — fetch a single thread.
 * Skeleton implementation; replace with Convex query.
 */
export function useCommentThread(
  _threadId: string
): { thread: Thread | null; comments: Comment[]; isLoading: boolean } {
  return { thread: null, comments: [], isLoading: false };
}

/**
 * useCommentActions — thread/comment mutations.
 * Skeleton implementation; replace with Convex mutations.
 */
export function useCommentActions() {
  return {
    async createThread(_docId: string, _blockId: string, _content: string) {
      throw new Error("useCommentActions.createThread: skeleton not implemented");
    },
    async createComment(_docId: string, _blockId: string, _threadId: string, _content: string) {
      throw new Error("useCommentActions.createComment: skeleton not implemented");
    },
    async replyToComment(_parentCommentId: string, _content: string) {
      throw new Error("useCommentActions.replyToComment: skeleton not implemented");
    },
    async resolveThread(_threadId: string, _resolved: boolean = true) {
      throw new Error("useCommentActions.resolveThread: skeleton not implemented");
    },
    async deleteComment(_commentId: string) {
      throw new Error("useCommentActions.deleteComment: skeleton not implemented");
    },
  } as const;
}

