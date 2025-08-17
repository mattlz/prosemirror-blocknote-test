"use client";
import { useMemo, useState, type ReactElement } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CommentsSidebar(props: { docId: string; onJumpToBlock?: (blockId: string) => void; onCreateThread?: (content: string) => void | Promise<void> }): ReactElement {
  const { docId, onJumpToBlock, onCreateThread } = props;
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const includeResolved = filter !== "open";
  const threads = (useQuery(api.comments.listByDoc, { docId, includeResolved }) ?? []) as Array<{ thread: any; comments: any[] }>;
  const me = useQuery(api.comments.me, {} as any) as any;
  const filtered = useMemo(() => {
    if (filter === "all") return threads;
    if (filter === "open") return threads.filter((t) => !t.thread.resolved);
    return threads.filter((t) => t.thread.resolved);
  }, [threads, filter]);

  const resolveThread = useMutation(api.comments.resolveThread);
  const deleteComment = useMutation(api.comments.deleteComment);
  const replyToComment = useMutation(api.comments.replyToComment);
  const updateComment = useMutation(api.comments.updateComment);

  // Author user info resolution for display
  const allAuthorIds = useMemo(() => {
    const ids = new Set<string>();
    for (const { comments } of filtered) {
      for (const c of comments) { if (c?.authorId) ids.add(c.authorId); }
    }
    return Array.from(ids);
  }, [filtered]);
  const users = useQuery(api.comments.resolveUsers, { ids: allAuthorIds } as any) as Array<{ id: string; username: string; avatarUrl: string }> | undefined;
  const usersMap = useMemo(() => {
    const m: Record<string, { username: string; avatarUrl: string }> = {};
    for (const u of users ?? []) { m[u.id] = { username: u.username, avatarUrl: u.avatarUrl }; }
    return m;
  }, [users]);

  return (
    <aside className="w-80 shrink-0 border-l bg-white p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">Comments <span className="text-neutral-400">{filtered.length}</span></div>
        <div className="flex gap-1 text-xs">
          <button className={["px-2 py-1 rounded border", filter === "all" ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={() => setFilter("all")}>All</button>
          <button className={["px-2 py-1 rounded border", filter === "open" ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={() => setFilter("open")}>Open</button>
          <button className={["px-2 py-1 rounded border", filter === "resolved" ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={() => setFilter("resolved")}>Resolved</button>
        </div>
      </div>
      {onCreateThread ? (
        <div className="mt-3">
          <button className="w-full rounded border px-2 py-1 text-sm" onClick={async () => {
            const content = prompt("New comment", "") ?? "";
            if (!content.trim()) return;
            await onCreateThread?.(content.trim());
          }}>New comment</button>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-neutral-500">No comments yet.</div>
        ) : (
          filtered.map(({ thread, comments }) => {
            const first = comments[0];
            const replies = comments.slice(1);
            const [expanded, setExpanded] = [true, () => {}];
            return (
              <ThreadCard
                key={thread.id}
                thread={thread}
                first={first}
                replies={replies}
                canEdit={(id: string) => me?.userId && id === me.userId}
                onJumpToBlock={onJumpToBlock}
                canResolve={me?.userId && me.userId === thread.creatorId}
                onResolve={(resolved: boolean) => resolveThread({ threadId: thread.id, resolved }).catch(() => {})}
                onDeleteComment={(commentId: string) => deleteComment({ commentId: commentId as any }).catch(() => {})}
                onReply={async (content: string) => {
                  if (!first?._id) return;
                  await replyToComment({ parentCommentId: first._id, content }).catch(() => {});
                }}
                onEdit={async (commentId: string, content: string) => {
                  await updateComment({ commentId: commentId as any, content }).catch(() => {});
                }}
                resolveUsername={(id: string) => usersMap[id]?.username ?? id}
              />
            );
          })
        )}
      </div>
    </aside>
  );
}

function ThreadCard({
  thread,
  first,
  replies,
  canEdit,
  canResolve,
  onJumpToBlock,
  onResolve,
  onDeleteComment,
  onReply,
  onEdit,
  resolveUsername,
}: {
  thread: any;
  first: any;
  replies: any[];
  canEdit: (authorId: string) => boolean;
  canResolve: boolean;
  onJumpToBlock?: (blockId: string) => void;
  onResolve: (resolved: boolean) => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  resolveUsername: (id: string) => string;
}): ReactElement {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [reply, setReply] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  return (
    <div className="rounded border p-2">
      <div className="flex items-center justify-between">
        <button className="text-left font-medium hover:underline" onClick={() => onJumpToBlock?.(thread.blockId)}>
          {first?.content?.slice(0, 80) || "(No content)"}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{replies.length} repl{replies.length === 1 ? "y" : "ies"}</span>
          <button className="text-xs text-neutral-500" onClick={() => setExpanded((v) => !v)}>{expanded ? "Hide" : "Show"}</button>
          {thread.resolved ? (
            <span className="text-xs text-green-600">Resolved</span>
          ) : null}
        </div>
      </div>
      <div className="mt-1 text-xs text-neutral-500">{new Date(thread.createdAt).toLocaleString()}</div>
      {expanded ? (
        <div className="mt-2 space-y-2">
          <CommentView
            comment={first}
            username={resolveUsername(first?.authorId)}
            canEdit={canEdit(first?.authorId)}
            onDelete={() => onDeleteComment(first._id)}
            onEditStart={() => { setEditingId(first._id); setEditingText(first.content ?? ""); }}
            onEditCancel={() => { setEditingId(null); setEditingText(""); }}
            onEditSave={async () => { await onEdit(first._id, editingText); setEditingId(null); }}
            isEditing={editingId === first._id}
            editingText={editingText}
            setEditingText={setEditingText}
          />
          {replies.length > 0 ? (
            <div className="pl-3 border-l space-y-2">
              {replies.map((c: any) => (
                <CommentView
                  key={c._id}
                  comment={c}
                  username={resolveUsername(c.authorId)}
                  canEdit={canEdit(c.authorId)}
                  onDelete={() => onDeleteComment(c._id)}
                  onEditStart={() => { setEditingId(c._id); setEditingText(c.content ?? ""); }}
                  onEditCancel={() => { setEditingId(null); setEditingText(""); }}
                  onEditSave={async () => { await onEdit(c._id, editingText); setEditingId(null); }}
                  isEditing={editingId === c._id}
                  editingText={editingText}
                  setEditingText={setEditingText}
                />
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex gap-2">
            {canResolve ? (
              !thread.resolved ? (
                <button className="text-xs rounded border px-2 py-1" onClick={() => onResolve(true)}>Resolve</button>
              ) : (
                <button className="text-xs rounded border px-2 py-1" onClick={() => onResolve(false)}>Reopen</button>
              )
            ) : null}
          </div>
          <div className="mt-2 flex gap-2">
            <input className="flex-1 rounded border px-2 py-1 text-sm" placeholder="Reply…" value={reply} onChange={(e) => setReply(e.target.value)} />
            <button className="text-xs rounded border px-2 py-1" onClick={async () => { if (reply.trim().length === 0) return; await onReply(reply.trim()); setReply(""); }}>Send</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CommentView({
  comment,
  username,
  canEdit,
  onDelete,
  onEditStart,
  onEditCancel,
  onEditSave,
  isEditing,
  editingText,
  setEditingText,
}: {
  comment: any;
  username: string;
  canEdit: boolean;
  onDelete: () => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void | Promise<void>;
  isEditing: boolean;
  editingText: string;
  setEditingText: (v: string) => void;
}): ReactElement {
  return (
    <div className="text-sm flex items-start justify-between gap-2">
      <div className="flex-1">
        <div className="text-xs text-neutral-500">{username} • {new Date(comment.createdAt).toLocaleString()}</div>
        {!isEditing ? (
          <div>{comment.content}</div>
        ) : (
          <div className="flex gap-2 items-start">
            <textarea className="w-full rounded border p-1 text-sm" rows={2} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
            <div className="flex flex-col gap-1">
              <button className="text-xs rounded border px-2 py-1" onClick={() => onEditSave()}>Save</button>
              <button className="text-xs rounded border px-2 py-1" onClick={() => onEditCancel()}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 items-end">
        {canEdit ? (
          !isEditing ? (
            <button className="text-xs text-neutral-600 hover:underline" onClick={() => onEditStart()}>Edit</button>
          ) : null
        ) : null}
        {canEdit ? (
          <button className="text-xs text-red-600 hover:underline" onClick={() => onDelete()}>Delete</button>
        ) : null}
      </div>
    </div>
  );
}



