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

export function useEditorComments(docId: string, userId: string | null) {
  const threadsForDoc = (useQuery(api.comments.listByDoc, { docId, includeResolved: true }) ?? []) as ThreadData[];
  
  // Comment mutations
  const createThreadMutation = useMutation(api.comments.createThread);
  const addCommentMutation = useMutation(api.comments.addComment);
  const updateCommentMutation = useMutation(api.comments.updateComment);
  const deleteCommentMutation = useMutation(api.comments.deleteComment);
  const resolveThreadMutation = useMutation(api.comments.resolveThread);

  // Create thread store for BlockNote comments integration
  const threadStore = useMemo(() => new ConvexThreadStore(docId, {
    userId: userId || "current",
    createThread: ({ docId: d, blockId, content }) => createThreadMutation({ docId: d, blockId: blockId ?? "", content }),
    createComment: ({ docId: d, blockId, threadId, content }) => addCommentMutation({ docId: d, blockId: blockId ?? "", threadId, content }),
    updateComment: ({ commentId, content }) => updateCommentMutation({ commentId, content }),
    deleteComment: ({ commentId }) => deleteCommentMutation({ commentId }),
    resolveThread: ({ threadId, resolved }) => resolveThreadMutation({ threadId, resolved }),
  }), [docId, userId, createThreadMutation, addCommentMutation, updateCommentMutation, deleteCommentMutation, resolveThreadMutation]);

  return {
    threadsForDoc,
    threadStore,
  };
}