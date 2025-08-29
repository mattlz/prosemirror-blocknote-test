"use client";
import { useState, type ReactElement } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useCommentThread, useCommentActions } from "@/hooks/features/use-comment-threads";

export function CommentThread({ threadId, onJumpToBlock }: { threadId: string; onJumpToBlock?: (blockId: string) => void }): ReactElement {
  const { data } = useCommentThread(threadId);
  const [expanded, setExpanded] = useState<boolean>(true);
  const { deleteComment, resolveThread } = useCommentActions();

  if (!data) return <div className="text-sm text-neutral-500">Loading…</div>;
  const { thread, comments } = data;
  const first = comments[0];
  const replies = comments.slice(1);

  return (
    <div className="rounded border p-2">
      <div className="flex items-center justify-between">
        <button className="text-left font-medium hover:underline" onClick={() => onJumpToBlock?.(thread.blockId)}>
          {first?.content?.slice(0, 80) || "(No content)"}
        </button>
        <div className="flex items-center gap-2">
          <button className="text-xs text-neutral-500" onClick={() => setExpanded((v) => !v)}>{expanded ? "Hide" : "Show"}</button>
          {thread.resolved ? (<span className="text-xs text-green-600">Resolved</span>) : null}
        </div>
      </div>
      <div className="mt-1 text-xs text-neutral-500">{new Date(thread.createdAt).toLocaleString()}</div>
      {expanded ? (
        <div className="mt-2 space-y-2">
          <div className="text-sm">{first?.content}</div>
          {replies.length > 0 ? (
            <div className="pl-3 border-l space-y-2">
              {replies.map((c) => (
                <div key={c._id} className="text-sm flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleString()}</div>
                    <div>{c.content}</div>
                  </div>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => deleteComment({ commentId: c._id as Id<"comments"> }).catch(() => {})}>Delete</button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex gap-2">
            {!thread.resolved ? (
              <button className="text-xs rounded border px-2 py-1" onClick={() => resolveThread({ threadId: thread.id as string, resolved: true }).catch(() => {})}>Resolve</button>
            ) : (
              <button className="text-xs rounded border px-2 py-1" onClick={() => resolveThread({ threadId: thread.id as string, resolved: false }).catch(() => {})}>Reopen</button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
