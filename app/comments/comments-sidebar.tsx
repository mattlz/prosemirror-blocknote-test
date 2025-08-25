"use client";
import { useMemo, useState, type ReactElement } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CommentsSidebar(props: { docId: string; readOnly?: boolean; onJumpToBlock?: (blockId: string) => void; onCreateThread?: (content: string) => void | Promise<void> }): ReactElement {
  const { docId, readOnly = false, onJumpToBlock, onCreateThread } = props;
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const includeResolved = filter !== "open";
  const threads = (useQuery(api.comments.listByDoc, { docId, includeResolved }) ?? []) as Array<{ thread: any; comments: any[] }>;
  const me = useQuery(api.comments.me, {} as any) as any;
  const [newContent, setNewContent] = useState<string>("");
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
      {(!readOnly && onCreateThread) ? (
        <div className="mt-3">
          <ReplyInput
            placeholder="Leave a comment..."
            value={newContent}
            onChange={setNewContent}
            onSend={async () => { if (!newContent.trim()) return; await onCreateThread?.(newContent.trim()); setNewContent(""); }}
          />
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
                canEdit={(id: string) => !readOnly && me?.userId && id === me.userId}
                onJumpToBlock={onJumpToBlock}
                canResolve={!readOnly && me?.userId && me.userId === thread.creatorId}
                onResolve={(resolved: boolean) => { if (readOnly) return; resolveThread({ threadId: thread.id, resolved }).catch(() => {}); }}
                onDeleteComment={(commentId: string) => { if (readOnly) return; deleteComment({ commentId: commentId as any }).catch(() => {}); }}
                onReply={async (content: string) => {
                  if (readOnly) return;
                  if (!first?._id) return;
                  await replyToComment({ parentCommentId: first._id, content }).catch(() => {});
                }}
                onEdit={async (commentId: string, content: string) => {
                  if (readOnly) return;
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
  const [expanded, setExpanded] = useState<boolean>(false);
  const [showReply, setShowReply] = useState<boolean>(false);
  const [reply, setReply] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  
  const resolvedClass = thread.resolved ? "opacity-60" : "";
  const authorName = resolveUsername(first?.authorId) || "User";
  const avatarInitial = (authorName?.[0] ?? "U").toUpperCase();
  const timeText = formatTime(first?.createdAt || thread.createdAt);
  
  const handleCardClick = () => {
    if (!expanded) {
      setExpanded(true);
      setShowReply(true);
    }
  };
  
  return (
    <div className={["rounded-lg border border-gray-200 bg-white", resolvedClass].join(" ")}>
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleCardClick}
      >
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium flex-shrink-0">
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex flex-col items-left mb-3">
                  <span className="font-semibold text-sm">{authorName}</span>
                  <span className="text-xs text-gray-500">{timeText}</span>
                </div>
                <div className="text-sm text-gray-700 mt-1 break-words">
                  {first?.content || "(No content)"}
                </div>
                {replies.length > 0 && !expanded ? (
                  <button 
                    className="text-xs text-blue-600 hover:underline mt-1"
                    onClick={(e) => { e.stopPropagation(); setExpanded(true); setShowReply(true); }}
                  >
                    {replies.length} {replies.length === 1 ? "reply" : "replies"}
                  </button>
                ) : null}
              </div>
              <div style={{ position: "relative", marginTop: "-2px", marginLeft: "3px" }} className="flex items-center gap-0" onClick={(e) => e.stopPropagation()}>
                
              {canEdit(first?.authorId) ? (
                  <div className="relative">
                    <button
                      className="p-0 rounded hover:bg-gray-200 text-gray-600 mt-1"
                      onClick={() => setMenuOpen(!menuOpen)}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {menuOpen ? (
                      <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => {
                            setEditingId(first._id);
                            setEditingText(first.content ?? "");
                            setMenuOpen(false);
                            setExpanded(true);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                          onClick={() => {
                            onDeleteComment(first._id);
                            setMenuOpen(false);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete thread
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {canResolve ? (
                  <button
                    className={["p-0 rounded hover:bg-gray-200", thread.resolved ? "text-green-600" : "text-gray-400"].join(" ")}
                    onClick={() => onResolve(!thread.resolved)}
                    title={thread.resolved ? "Unresolve" : "Resolve"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {expanded ? (
        <div className="border-t border-gray-100">
          {editingId === first._id ? (
            <div className="p-3">
              <textarea
                className="w-full rounded border border-gray-300 p-2 text-sm"
                rows={3}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
              />
              <div className="flex gap-2 mt-2">
                <button
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={async () => {
                    await onEdit(first._id, editingText);
                    setEditingId(null);
                  }}
                >
                  Save
                </button>
                <button
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => {
                    setEditingId(null);
                    setEditingText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          
          {replies.length > 0 ? (
            <div className="p-3 space-y-3 border-t border-gray-100">
              {replies.map((c: any) => {
                const replyAuthor = resolveUsername(c.authorId) || "User";
                const replyInitial = (replyAuthor?.[0] ?? "U").toUpperCase();
                const replyTime = formatTime(c.createdAt);
                
                return (
                  <div key={c._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {replyInitial}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col items-left mb-3">
                        <span className="font-semibold text-sm">{replyAuthor}</span>
                        <span className="text-xs text-gray-500">{replyTime}</span>
                      </div>
                      {editingId === c._id ? (
                        <div className="mt-1">
                          <textarea
                            className="w-full rounded border border-gray-300 p-2 text-sm"
                            rows={2}
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              onClick={async () => {
                                await onEdit(c._id, editingText);
                                setEditingId(null);
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                              onClick={() => {
                                setEditingId(null);
                                setEditingText("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-700 mt-1 break-words">
                          {c.content}
                        </div>
                      )}
                      {canEdit(c.authorId) && editingId !== c._id ? (
                        <div className="flex gap-2 mt-1">
                          <button
                            className="text-xs text-gray-500 hover:text-gray-700"
                            onClick={() => {
                              setEditingId(c._id);
                              setEditingText(c.content ?? "");
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={() => onDeleteComment(c._id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          
          {showReply ? (
            <div className="p-3 border-t border-gray-100">
              <ReplyInput
                placeholder="Reply..."
                value={reply}
                onChange={setReply}
                onSend={async () => {
                  if (reply.trim().length === 0) return;
                  await onReply(reply.trim());
                  setReply("");
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// CommentView component removed - now inline in ThreadCard


function ReplyInput({ placeholder = "Reply...", value, onChange, onSend }: { placeholder?: string; value: string; onChange: (v: string) => void; onSend: () => void | Promise<void> }): ReactElement {
  return (
    <div className="relative">
      <input
        className="w-full rounded-full border border-gray-300 pl-4 pr-16 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <div className="absolute inset-y-0 right-2 flex items-center">
        <button 
          className="rounded-full bg-blue-600 text-white px-3 py-1 text-xs hover:bg-blue-700 transition-colors" 
          onClick={() => onSend()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
           ` at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
}



