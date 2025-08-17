import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
export function useComments(docId: string){
  const threads = (useQuery(api.comments.listByDoc, { docId, includeResolved: true }) ?? []) as any[];
  const createThread = useMutation(api.comments.createThread);
  const createComment = useMutation(api.comments.createComment);
  const updateComment = useMutation(api.comments.updateComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const resolveThread = useMutation(api.comments.resolveThread);
  return { threads, createThread, createComment, updateComment, deleteComment, resolveThread };
}

