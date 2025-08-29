import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Comment, Thread } from "@/types/comments";

export interface ResolvedUser {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface ThreadWithComments<TThread = Thread, TComment = Comment> {
  thread: TThread;
  comments: TComment[];
}

export function useCommentThreads(docId: string | null, includeResolved = true) {
  const rowsRaw = useQuery(
    api.comments.listByDoc,
    docId ? { docId, includeResolved } : "skip"
  ) as ThreadWithComments<Thread, Comment>[] | undefined;
  const rows = rowsRaw ?? [];

  // Collect author IDs for display resolution
  const authorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const { comments } of rows) {
      for (const c of comments) {
        const id = c?.authorId as string | undefined;
        if (id) ids.add(id);
      }
    }
    return Array.from(ids);
  }, [rowsRaw]);

  const users = useQuery(api.comments.resolveUsers, authorIds.length ? { ids: authorIds } : "skip") as ResolvedUser[] | undefined;

  const usersMap = useMemo(() => {
    const m: Record<string, { username: string; avatarUrl: string }> = {};
    for (const u of users ?? []) m[u.id] = { username: u.username, avatarUrl: u.avatarUrl };
    return m;
  }, [users]);

  return { threads: rows, usersMap };
}

export function useCommentThread(threadId: string | null) {
  const data = useQuery(api.comments.getThread, threadId ? { threadId } : "skip") as
    | ThreadWithComments<Thread, Comment>
    | null
    | undefined;
  return { data, isLoading: data === undefined };
}

export function useCommentActions() {
  const createThread = useMutation(api.comments.createThread);
  const createComment = useMutation(api.comments.createComment);
  const replyToComment = useMutation(api.comments.replyToComment);
  const updateComment = useMutation(api.comments.updateComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const resolveThread = useMutation(api.comments.resolveThread);

  return {
    createThread,
    createComment,
    replyToComment,
    updateComment,
    deleteComment,
    resolveThread,
  } as const;
}
