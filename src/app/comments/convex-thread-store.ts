import type { CommentBody, CommentData, ThreadData } from "@blocknote/core/comments";
import type { Comment as ConvexComment, Thread as ConvexThread } from "@/types/comments";
import { DefaultThreadStoreAuth, ThreadStore } from "@blocknote/core/comments";

type CreateThreadArgs = {
  docId: string;
  blockId?: string;
  content: string;
};

type CreateCommentArgs = {
  docId: string;
  blockId?: string;
  threadId: string;
  content: string;
};

export type ConvexThreadStoreDeps = {
  userId: string;
  role?: "editor" | "commenter";
  createThread: (args: CreateThreadArgs) => Promise<{ threadId: string }>;
  createComment: (args: CreateCommentArgs) => Promise<unknown>;
  updateComment: (args: { commentId: string; content: string }) => Promise<unknown>;
  deleteComment: (args: { commentId: string }) => Promise<unknown>;
  resolveThread: (args: { threadId: string; resolved?: boolean }) => Promise<unknown>;
};

type BNNode = { text?: string; content?: BNNode[] };

function plainTextFromBody(body: CommentBody): string {
  try {
    // Body is a BlockNote doc (array of blocks). Extract plain text.
    const nodes: BNNode[] = Array.isArray(body)
      ? (body as unknown as BNNode[])
      : (typeof body === "object" && body !== null && "content" in (body as Record<string, unknown>)
          ? ((body as Record<string, unknown>).content as BNNode[])
          : []);
    const parts: string[] = [];
    const walk = (n: BNNode) => {
      if (!n) return;
      if (typeof n.text === "string") parts.push(n.text);
      if (Array.isArray(n.content)) n.content.forEach(walk);
    };
    nodes.forEach(walk);
    return parts.join(" ").trim();
  } catch {
    return "";
  }
}

function bodyFromStored(content: string): CommentBody {
  // If stored content is a serialized BN doc, parse it; otherwise wrap as paragraph text
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    return [
      {
        type: "paragraph",
        content: content ? [{ type: "text", text: content }] : [],
      },
    ];
  }
}

export class ConvexThreadStore extends ThreadStore {
  private threads: Map<string, ThreadData> = new Map();
  private listeners: Set<(threads: Map<string, ThreadData>) => void> = new Set();
  private readonly docId: string;
  private readonly deps: ConvexThreadStoreDeps;

  constructor(docId: string, deps: ConvexThreadStoreDeps) {
    super(new DefaultThreadStoreAuth(deps.userId, deps.role ?? "editor"));
    this.docId = docId;
    this.deps = deps;
  }

  // Called from React layer when Convex query updates
  public setThreadsFromConvex(rows: Array<{ thread: ConvexThread; comments: ConvexComment[] }>): void {
    const map = new Map<string, ThreadData>();
    for (const { thread, comments } of rows) {
      const t: ThreadData = {
        type: "thread",
        id: thread.id,
        createdAt: new Date(thread.createdAt),
        updatedAt: new Date(thread.createdAt),
        resolved: !!thread.resolved,
        metadata: { docId: thread.docId, blockId: thread.blockId },
      };
      const cs: CommentData[] = comments.map((c) => ({
        type: "comment",
        id: String(c._id),
        userId: c.authorId,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        reactions: [],
        metadata: {},
        body: bodyFromStored(c.content),
      }));
      t.comments = cs;
      map.set(t.id, t);
    }
    this.threads = map;
    this.emit();
  }

  private emit(): void {
    for (const cb of this.listeners) cb(this.getThreads());
  }

  // ThreadStore interface
  async createThread(options: { initialComment: { body: CommentBody; metadata?: unknown }; metadata?: unknown }): Promise<ThreadData> {
    const text = plainTextFromBody(options.initialComment.body);
    const res = await this.deps.createThread({ docId: this.docId, content: text });
    const now = new Date();
    const td: ThreadData = {
      type: "thread",
      id: res.threadId,
      createdAt: now,
      updatedAt: now,
      resolved: false,
      metadata: options.metadata,
      comments: [
        {
          type: "comment",
          id: "temp",
          userId: this.deps.userId ?? "",
          createdAt: now,
          updatedAt: now,
          reactions: [],
          metadata: options.initialComment.metadata,
          body: options.initialComment.body,
        },
      ],
    };
    // Optimistic: don't insert into map; real data will arrive via setThreadsFromConvex
    return td;
  }

  async addComment(options: { comment: { body: CommentBody; metadata?: unknown }; threadId: string }): Promise<CommentData> {
    const text = plainTextFromBody(options.comment.body);
    await this.deps.createComment({ docId: this.docId, threadId: options.threadId, content: text });
    const now = new Date();
    return {
      type: "comment",
      id: "temp",
      userId: this.deps.userId ?? "",
      createdAt: now,
      updatedAt: now,
      reactions: [],
      metadata: options.comment.metadata,
      body: options.comment.body,
    };
  }

  async updateComment(options: { comment: { body: CommentBody; metadata?: unknown }; threadId: string; commentId: string }): Promise<void> {
    const text = plainTextFromBody(options.comment.body);
    await this.deps.updateComment({ commentId: options.commentId, content: text });
  }

  async deleteComment(options: { threadId: string; commentId: string }): Promise<void> {
    await this.deps.deleteComment({ commentId: options.commentId });
  }

  async deleteThread(_options: { threadId: string }): Promise<void> {
    // Not implemented: deleting a thread entirely; could be added via new Convex endpoint
    return;
  }

  async resolveThread(options: { threadId: string }): Promise<void> {
    await this.deps.resolveThread({ threadId: options.threadId, resolved: true });
  }

  async unresolveThread(options: { threadId: string }): Promise<void> {
    await this.deps.resolveThread({ threadId: options.threadId, resolved: false });
  }

  async addReaction(_options: { threadId: string; commentId: string; emoji: string }): Promise<void> {
    // Reactions not implemented in Convex backend yet
    return;
  }

  async deleteReaction(_options: { threadId: string; commentId: string; emoji: string }): Promise<void> {
    // Reactions not implemented in Convex backend yet
    return;
  }

  getThread(threadId: string): ThreadData {
    const t = this.threads.get(threadId);
    if (!t) throw new Error("Thread not found");
    return t;
    }

  getThreads(): Map<string, ThreadData> {
    return new Map(this.threads);
  }

  subscribe(cb: (threads: Map<string, ThreadData>) => void): () => void {
    this.listeners.add(cb);
    // Do not emit immediately; we'll emit after the first Convex hydration.
    // Prevents accessing editor state before initialization.
    return () => {
      this.listeners.delete(cb);
    };
  }
}

