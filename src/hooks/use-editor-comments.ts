/**
 * useEditorComments - Manages comments and thread operations for the editor
 * 
 * @param docId - Document ID
 * @param userId - Current user ID
 * @returns Comments data and thread store
 */

import { useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ConvexThreadStore } from '@/app/comments/convex-thread-store';
import type { ThreadData } from '@/types';
import type { Id } from '@/convex/_generated/dataModel';

export function useEditorComments(docId: string, userId: string | null) {
  const threadsRaw = useQuery(api.comments.listByDoc, { docId, includeResolved: true }) ?? [];
  
  // Convert the threads data to match ThreadData type
  const threadsForDoc = threadsRaw.map((t: any) => ({
    thread: {
      ...t.thread,
      threadId: t.thread._id as Id<"commentThreads">,
    },
    comments: t.comments.map((c: any) => ({
      ...c,
      threadId: c.threadId as Id<"commentThreads">,
    })),
  })) as ThreadData[];
  
  // Comment mutations
  const createThreadMutation = useMutation(api.comments.createThread);
  const createCommentMutation = useMutation(api.comments.createComment);
  const updateCommentMutation = useMutation(api.comments.updateComment);
  const deleteCommentMutation = useMutation(api.comments.deleteComment);
  const resolveThreadMutation = useMutation(api.comments.resolveThread);

  // Create thread store for BlockNote comments integration
  const threadStore = useMemo(() => new ConvexThreadStore(docId, {
    userId: userId || "current",
    createThread: ({ docId: d, blockId, content }) => createThreadMutation({ docId: d, blockId: blockId ?? "", content }),
    createComment: ({ docId: d, blockId, threadId, content }) => createCommentMutation({ docId: d, blockId: blockId ?? "", threadId: threadId as Id<"commentThreads">, content }),
    updateComment: ({ commentId, content }) => updateCommentMutation({ commentId: commentId as Id<"comments">, content }),
    deleteComment: ({ commentId }) => deleteCommentMutation({ commentId: commentId as Id<"comments"> }),
    resolveThread: ({ threadId, resolved }) => resolveThreadMutation({ threadId: threadId as Id<"commentThreads">, resolved }),
  }), [docId, userId, createThreadMutation, createCommentMutation, updateCommentMutation, deleteCommentMutation, resolveThreadMutation]);

  return {
    threadsForDoc,
    threadStore,
  };
}