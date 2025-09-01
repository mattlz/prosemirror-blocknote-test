## Prototype ↔ Strideos Alignment Plan (Editor + Comments + Templates + Projects)

Goals
- Keep the prototype editor exactly as-is.
- Merge comments so prototype supports BOTH document-block comments and task comments.
- Align templates to main app’s model and add a Projects integration that creates a Project + Project Brief doc and links them.
- Provide a single, self-contained set of schema and API changes you can apply in the prototype (no access to strideos required).

### Phase 1 — Schema alignment (convex/schema.ts)

Checklist
- [x] Ensure users include email/name/image/role and optional client/department references
- [x] Expand comments and commentThreads to support tasks and cross-entity links; add indexes
- [x] Add notifications table (used by mentions/activity)
- [x] Enhance documentTemplates to support “snapshot” pages model (keep key for “blank” back-compat)
- [x] Ensure documents/documentPages fields and indexes needed by sync and projects

Edits (add or update these table definitions and indexes in `convex/schema.ts`):

```ts
// USERS (ensure these fields exist)
users: defineTable({
  email: v.string(),
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  role: v.optional(v.union(v.literal("admin"), v.literal("pm"), v.literal("task_owner"), v.literal("client"))),
  clientId: v.optional(v.id("clients")),
  departmentIds: v.optional(v.array(v.id("departments"))),
  createdAt: v.optional(v.number()),
  updatedAt: v.optional(v.number()),
}).index("by_email", ["email"]),

// COMMENTS (merge doc + task flows)
comments: defineTable({
  // Document-block context
  docId: v.optional(v.string()),
  blockId: v.optional(v.string()),
  // Cross-entity
  taskId: v.optional(v.id("tasks")),
  projectId: v.optional(v.id("projects")),
  sprintId: v.optional(v.id("sprints")),
  entityType: v.optional(v.union(
    v.literal("document_block"),
    v.literal("task"),
    v.literal("project"),
    v.literal("sprint")
  )),
  // Threading
  threadId: v.optional(v.string()),
  parentCommentId: v.optional(v.id("comments")),
  // Content + mentions
  content: v.string(),
  authorId: v.optional(v.id("users")),
  mentions: v.optional(v.array(v.object({
    userId: v.string(),
    position: v.number(),
    length: v.number(),
  }))),
  // Status
  resolved: v.optional(v.boolean()),
  resolvedBy: v.optional(v.string()),
  resolvedAt: v.optional(v.number()),
  editedAt: v.optional(v.number()),
  deleted: v.optional(v.boolean()),
  // Audit
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_doc", ["docId"]) 
  .index("by_thread", ["threadId"]) 
  .index("by_block", ["blockId"]) 
  .index("by_task", ["taskId"]) 
  .index("by_doc_resolved", ["docId", "resolved"]),

// COMMENT THREADS (doc + task)
commentThreads: defineTable({
  id: v.string(),                  // public thread id
  docId: v.optional(v.string()),
  blockId: v.optional(v.string()),
  taskId: v.optional(v.id("tasks")),
  projectId: v.optional(v.id("projects")),
  sprintId: v.optional(v.id("sprints")),
  entityType: v.optional(v.union(
    v.literal("document_block"),
    v.literal("task"),
    v.literal("project"),
    v.literal("sprint")
  )),
  createdAt: v.number(),
  resolved: v.optional(v.boolean()),
  creatorId: v.optional(v.string()),
})
  .index("by_doc", ["docId"]) 
  .index("by_block", ["blockId"]) 
  .index("by_task", ["taskId"]) 
  .index("by_public_id", ["id"]),

// NOTIFICATIONS (required by mentions/activity)
notifications: defineTable({
  type: v.union(
    v.literal("comment_created"),
    v.literal("task_assigned"),
    v.literal("task_status_changed"),
    v.literal("document_updated"),
    v.literal("sprint_started"),
    v.literal("sprint_completed"),
    v.literal("mention"),
    v.literal("general"),
    v.literal("task_comment_mention"),
    v.literal("task_comment_activity"),
    v.literal("project_created")
  ),
  title: v.string(),
  message: v.string(),
  userId: v.id("users"),
  isRead: v.boolean(),
  priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
  relatedCommentId: v.optional(v.id("comments")),
  relatedTaskId: v.optional(v.id("tasks")),
  relatedDocumentId: v.optional(v.id("documents")),
  actionUrl: v.optional(v.string()),
  actionText: v.optional(v.string()),
  createdAt: v.number(),
  readAt: v.optional(v.number()),
})
  .index("by_user", ["userId"]) 
  .index("by_user_unread", ["userId", "isRead"]) 
  .index("by_type", ["type"]) 
  .index("by_created_at", ["createdAt"]) 
  .index("by_related_document", ["relatedDocumentId"]) 
  .index("by_related_task", ["relatedTaskId"]) 
  .index("by_task", ["relatedTaskId"]),

// DOCUMENT TEMPLATES (align with main app; keep key for 'blank')
documentTemplates: defineTable({
  key: v.optional(v.string()),         // back-compat (e.g., "blank")
  name: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.union(
    v.literal("project_brief"),
    v.literal("meeting_notes"),
    v.literal("wiki_article"),
    v.literal("resource_doc"),
    v.literal("retrospective"),
    v.literal("general"),
    v.literal("user_created")
  )),
  snapshot: v.optional(v.object({
    documentTitle: v.string(),
    documentMetadata: v.optional(v.any()),
    pages: v.array(v.object({
      title: v.string(),
      icon: v.optional(v.string()),
      order: v.number(),
      content: v.string(), // PM JSON string
      subpages: v.optional(v.array(v.object({
        title: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        content: v.string(),
      }))),
    })),
  })),
  thumbnailUrl: v.optional(v.string()),
  usageCount: v.optional(v.number()),
  isPublic: v.optional(v.boolean()),
  isActive: v.optional(v.boolean()),
  createdBy: v.optional(v.id("users")),
  createdAt: v.number(),
  lastUsedAt: v.optional(v.number()),
})
  .index("by_key", ["key"])           // keep for 'blank'
  .index("by_category", ["category"]) 
  .index("by_active", ["isActive"]) 
  .index("by_public", ["isPublic"]) 
  .index("by_created_by", ["createdBy"]),

// DOCUMENTS (ensure fields + indexes)
documents: defineTable({
  title: v.string(),
  createdAt: v.number(),
  ownerId: v.optional(v.string()),
  archivedAt: v.optional(v.number()),
  shareId: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
  projectId: v.optional(v.id("projects")),
  clientId: v.optional(v.id("clients")),
  departmentId: v.optional(v.id("departments")),
  documentType: v.optional(v.union(
    v.literal("project_brief"),
    v.literal("meeting_notes"),
    v.literal("wiki_article"),
    v.literal("resource_doc"),
    v.literal("retrospective"),
    v.literal("blank")
  )),
  status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("archived"))),
  metadata: v.optional(v.any()),
  createdBy: v.optional(v.id("users")),
})
  .index("by_owner", ["ownerId"]) 
  .index("by_created", ["createdAt"]) 
  .index("by_shareId", ["shareId"]) 
  .index("by_status", ["status"]) 
  .index("by_type", ["documentType"]) 
  .index("by_project", ["projectId"]),

// DOCUMENT PAGES (make sure by_docId exists)
documentPages: defineTable({
  documentId: v.id("documents"),
  parentPageId: v.optional(v.id("documentPages")),
  docId: v.string(), // PM doc id
  title: v.string(),
  icon: v.optional(v.string()),
  order: v.number(),
  createdAt: v.number(),
})
  .index("by_document", ["documentId"]) 
  .index("by_document_parent", ["documentId", "parentPageId"]) 
  .index("by_document_order", ["documentId", "order"]) 
  .index("by_docId", ["docId"]),

// MINIMAL TASKS & PROJECTS (for task comments + project brief linking)
tasks: defineTable({
  title: v.string(),
  projectId: v.optional(v.id("projects")),
  assigneeId: v.optional(v.id("users")),
  status: v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("done"), v.literal("archived")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project", ["projectId"]),

projects: defineTable({
  title: v.string(),
  clientId: v.optional(v.id("clients")),
  departmentId: v.optional(v.id("departments")),
  visibility: v.union(v.literal("private"), v.literal("department"), v.literal("client"), v.literal("organization")),
  documentId: v.optional(v.id("documents")), // linked doc
  projectManagerId: v.optional(v.id("users")),
  teamMemberIds: v.optional(v.array(v.id("users"))),
  createdBy: v.optional(v.id("users")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_client", ["clientId"]) 
  .index("by_department", ["departmentId"]) 
  .index("by_status", ["visibility"]),
```

### Phase 2 — Merge Comments API (convex/comments.ts)

Checklist
- [ ] Keep editor endpoints and signatures: me, resolveUsers, listByDoc, createThread, createComment, updateComment, deleteComment, resolveThread, listByThread, getThread
- [ ] Add task endpoints: listByTask
- [ ] Add user search: searchUsers
- [ ] Add mentions + notifications to thread/comment creation
Checklist
- [x] Keep editor endpoints and signatures: me, resolveUsers, listByDoc, createThread, createComment, updateComment, deleteComment, resolveThread, listByThread, getThread
- [x] Add task endpoints: listByTask
- [x] Add user search: searchUsers
- [x] Add mentions + notifications to thread/comment creation

Replace the prototype `convex/comments.ts` with this merged superset:

```ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function parseMentions(content: string): Array<{ userId: string; position: number; length: number }> {
  const results: Array<{ userId: string; position: number; length: number }> = [];
  const mentionRegex = /@\[[^\]]+\]\(user:([^)]+)\)/g; // @[Name](user:userId)
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(content)) !== null) {
    const userId = match[1];
    const start = match.index;
    const len = match[0].length;
    if (userId) results.push({ userId, position: start, length: len });
  }
  return results;
}

function truncate(text: string, max = 120): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { userId: null, email: null } as const;
    const user = userId ? await ctx.db.get(userId) : null;
    return { userId, email: (user as any)?.email ?? null } as const;
  },
});

export const resolveUsers = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    const docs = await Promise.all(unique.map(async (id) => {
      try {
        const user = await ctx.db.get(id as any);
        return user ? { id, username: (user as any).email ?? "User", avatarUrl: "" } : null;
      } catch {
        return null;
      }
    }));
    return docs.filter(Boolean);
  },
});

export const searchUsers = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { query: q, limit }) => {
    const qLower = q.trim().toLowerCase();
    if (qLower.length === 0) return [] as Array<{ id: string; username: string; avatarUrl: string }>;
    const users = await ctx.db.query("users").collect();
    const matches = users.filter((u: any) => {
      const name = (u.name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return name.includes(qLower) || email.includes(qLower);
    });
    const mapped = matches.map((u: any) => ({ id: u._id, username: u.name ?? u.email ?? "User", avatarUrl: u.image ?? "" }));
    return limit ? mapped.slice(0, limit) : mapped;
  },
});

export const listByDoc = query({
  args: { docId: v.string(), includeResolved: v.optional(v.boolean()) },
  handler: async (ctx, { docId, includeResolved }) => {
    const threads = await ctx.db
      .query("commentThreads")
      .withIndex("by_doc", (q) => q.eq("docId", docId))
      .collect();
    const visible = includeResolved ? threads : threads.filter((t) => !t.resolved);
    const results = await Promise.all(
      visible.map(async (t) => {
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_thread", (q) => q.eq("threadId", t.id))
          .collect();
        comments.sort((a, b) => a.createdAt - b.createdAt);
        // enrich author
        const withAuthors = await Promise.all(comments.map(async (c) => {
          let author = null;
          if (c.authorId) {
            try {
              const u = await ctx.db.get(c.authorId);
              if (u) author = { _id: u._id, name: (u as any).name, email: (u as any).email, image: (u as any).image };
            } catch {}
          }
          return { ...c, author };
        }));
        return { thread: t, comments: withAuthors };
      })
    );
    return results;
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks"), includeResolved: v.optional(v.boolean()) },
  handler: async (ctx, { taskId, includeResolved }) => {
    const threads = await ctx.db
      .query("commentThreads")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    const visible = includeResolved ? threads : threads.filter((t) => !t.resolved);
    const results = await Promise.all(
      visible.map(async (t) => {
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_thread", (q) => q.eq("threadId", t.id))
          .collect();
        comments.sort((a, b) => a.createdAt - b.createdAt);
        const withAuthors = await Promise.all(comments.map(async (c) => {
          let author = null;
          if (c.authorId) {
            try {
              const u = await ctx.db.get(c.authorId);
              if (u) author = { _id: u._id, name: (u as any).name, email: (u as any).email, image: (u as any).image };
            } catch {}
          }
          return { ...c, author };
        }));
        return { thread: t, comments: withAuthors };
      })
    );
    return results;
  },
});

export const listByThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    return comments;
  },
});

export const getThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const thread = await ctx.db
      .query("commentThreads")
      .withIndex("by_public_id", (q) => q.eq("id", threadId))
      .first();
    if (!thread) return null;
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    const withAuthors = await Promise.all(comments.map(async (c) => {
      let author = null;
      if (c.authorId) {
        try {
          const u = await ctx.db.get(c.authorId);
          if (u) author = { _id: u._id, name: (u as any).name, email: (u as any).email, image: (u as any).image };
        } catch {}
      }
      return { ...c, author };
    }));
    return { thread, comments: withAuthors };
  },
});

function randomPublicId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const createThread = mutation({
  args: {
    content: v.string(),
    docId: v.optional(v.string()),
    blockId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    entityType: v.optional(v.union(v.literal("document_block"), v.literal("task"))),
  },
  handler: async (ctx, { content, docId, blockId, taskId, entityType }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const author = await ctx.db.get(userId);
    const now = Date.now();
    const threadId = randomPublicId();
    const inferredEntity = taskId ? "task" : (entityType ?? "document_block");

    await ctx.db.insert("commentThreads", {
      id: threadId,
      docId,
      blockId,
      taskId,
      entityType: inferredEntity,
      createdAt: now,
      resolved: false,
      creatorId: userId,
    });

    const mentions = parseMentions(content);
    const commentId = await ctx.db.insert("comments", {
      docId,
      blockId,
      taskId,
      entityType: inferredEntity,
      threadId,
      content,
      authorId: userId,
      mentions,
      createdAt: now,
      updatedAt: now,
    });

    // Mention notifications (skip self)
    if (mentions.length > 0) {
      const unique = Array.from(new Set(mentions.map((m) => m.userId)));
      const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
      const msg = truncate(content);
      await Promise.all(
        unique
          .filter((m) => m !== (userId as any))
          .map((mentionedUserId) =>
            ctx.db.insert("notifications", {
              type: inferredEntity === "task" ? "task_comment_mention" : "mention",
              title: inferredEntity === "task" ? `${authorName} mentioned you on a task` : `${authorName} mentioned you`,
              message: msg,
              userId: mentionedUserId as any,
              isRead: false,
              priority: "medium",
              relatedCommentId: commentId as any,
              relatedTaskId: inferredEntity === "task" ? (taskId as any) : undefined,
              createdAt: Date.now(),
            })
          )
      );
    }

    // Task activity notification (assignee, not author, not mentioned)
    if (inferredEntity === "task" && taskId) {
      try {
        const task = await ctx.db.get(taskId as any);
        const mentionsSet = new Set(mentions.map((m) => m.userId));
        const assigneeId = (task as any)?.assigneeId;
        if (assigneeId && assigneeId !== (userId as any) && !mentionsSet.has(assigneeId)) {
          const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
          await ctx.db.insert("notifications", {
            type: "task_comment_activity",
            title: "New comment on your task",
            message: `${authorName} commented on your task: ${(task as any)?.title ?? "Task"}`,
            userId: assigneeId,
            isRead: false,
            priority: "medium",
            relatedCommentId: commentId as any,
            relatedTaskId: taskId as any,
            createdAt: Date.now(),
          });
        }
      } catch {}
    }

    return { threadId };
  },
});

export const createComment = mutation({
  args: {
    threadId: v.string(),
    content: v.string(),
    docId: v.optional(v.string()),
    blockId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    entityType: v.optional(v.union(v.literal("document_block"), v.literal("task"))),
  },
  handler: async (ctx, { threadId, content, docId, blockId, taskId, entityType }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const author = await ctx.db.get(userId);
    const now = Date.now();

    const thread = await ctx.db
      .query("commentThreads")
      .withIndex("by_public_id", (q) => q.eq("id", threadId))
      .first();
    if (!thread) throw new Error("Thread not found");

    // Validate doc/block if in doc context
    if ((thread as any).docId && docId && (thread as any).docId !== docId) throw new Error("Invalid document for thread");
    if ((thread as any).blockId && blockId && (thread as any).blockId !== blockId) throw new Error("Invalid block for thread");

    const inferredTaskId = taskId ?? (thread as any).taskId ?? null;
    const inferredEntity = entityType ?? ((thread as any).entityType || (inferredTaskId ? "task" : "document_block"));

    const mentions = parseMentions(content);
    const inserted = await ctx.db.insert("comments", {
      docId: docId ?? (thread as any).docId,
      blockId: blockId ?? (thread as any).blockId,
      taskId: inferredTaskId ?? undefined,
      entityType: inferredEntity,
      threadId,
      content,
      authorId: userId,
      mentions,
      createdAt: now,
      updatedAt: now,
    });

    // Mentions
    if (mentions.length > 0) {
      const unique = Array.from(new Set(mentions.map((m) => m.userId)));
      const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
      const msg = truncate(content);
      await Promise.all(
        unique
          .filter((m) => m !== (userId as any))
          .map((mentionedUserId) =>
            ctx.db.insert("notifications", {
              type: inferredEntity === "task" ? "task_comment_mention" : "mention",
              title: inferredEntity === "task" ? `${authorName} mentioned you on a task` : `${authorName} mentioned you`,
              message: msg,
              userId: mentionedUserId as any,
              isRead: false,
              priority: "medium",
              relatedCommentId: inserted as any,
              relatedTaskId: inferredTaskId as any,
              createdAt: Date.now(),
            })
          )
      );
    }

    // Task activity (assignee, not author, not mentioned)
    if (inferredEntity === "task" && inferredTaskId) {
      try {
        const task = await ctx.db.get(inferredTaskId as any);
        const mentionsSet = new Set(mentions.map((m) => m.userId));
        const assigneeId = (task as any)?.assigneeId;
        if (assigneeId && assigneeId !== (userId as any) && !mentionsSet.has(assigneeId)) {
          const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
          await ctx.db.insert("notifications", {
            type: "task_comment_activity",
            title: "New comment on your task",
            message: `${authorName} commented on your task: ${(task as any)?.title ?? "Task"}`,
            userId: assigneeId,
            isRead: false,
            priority: "medium",
            relatedCommentId: inserted as any,
            relatedTaskId: inferredTaskId as any,
            createdAt: Date.now(),
          });
        }
      } catch {}
    }

    return inserted;
  },
});

export const replyToComment = mutation({
  args: { parentCommentId: v.id("comments"), content: v.string() },
  handler: async (ctx, { parentCommentId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const author = await ctx.db.get(userId);
    const parent = await ctx.db.get(parentCommentId);
    if (!parent) throw new Error("Parent comment not found");
    const now = Date.now();

    const inferredTaskId = (parent as any).taskId ?? null;
    const inferredEntity = (parent as any).entityType ?? (inferredTaskId ? "task" : "document_block");
    const mentions = parseMentions(content);

    const inserted = await ctx.db.insert("comments", {
      docId: (parent as any).docId,
      blockId: (parent as any).blockId,
      taskId: inferredTaskId ?? undefined,
      entityType: inferredEntity,
      threadId: (parent as any).threadId,
      content,
      authorId: userId,
      mentions,
      createdAt: now,
      updatedAt: now,
      parentCommentId,
    });

    // Mentions
    if (mentions.length > 0) {
      const unique = Array.from(new Set(mentions.map((m) => m.userId)));
      const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
      const msg = truncate(content);
      await Promise.all(
        unique
          .filter((m) => m !== (userId as any))
          .map((mentionedUserId) =>
            ctx.db.insert("notifications", {
              type: inferredEntity === "task" ? "task_comment_mention" : "mention",
              title: inferredEntity === "task" ? `${authorName} mentioned you on a task` : `${authorName} mentioned you`,
              message: msg,
              userId: mentionedUserId as any,
              isRead: false,
              priority: "medium",
              relatedCommentId: inserted as any,
              relatedTaskId: inferredTaskId as any,
              createdAt: Date.now(),
            })
          )
      );
    }

    // Task activity
    if (inferredEntity === "task" && inferredTaskId) {
      try {
        const task = await ctx.db.get(inferredTaskId as any);
        const mentionsSet = new Set(mentions.map((m) => m.userId));
        const assigneeId = (task as any)?.assigneeId;
        if (assigneeId && assigneeId !== (userId as any) && !mentionsSet.has(assigneeId)) {
          const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
          await ctx.db.insert("notifications", {
            type: "task_comment_activity",
            title: "New comment on your task",
            message: `${authorName} commented on your task: ${(task as any)?.title ?? "Task"}`,
            userId: assigneeId,
            isRead: false,
            priority: "medium",
            relatedCommentId: inserted as any,
            relatedTaskId: inferredTaskId as any,
            createdAt: Date.now(),
          });
        }
      } catch {}
    }

    return inserted;
  },
});

export const updateComment = mutation({
  args: { commentId: v.id("comments"), content: v.string() },
  handler: async (ctx, { commentId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const existing = await ctx.db.get(commentId);
    if (!existing) throw new Error("Comment not found");
    if (existing.authorId !== userId) throw new Error("Forbidden");
    await ctx.db.patch(commentId, { content, updatedAt: Date.now() });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const existing = await ctx.db.get(commentId);
    if (!existing) throw new Error("Comment not found");
    if (existing.authorId !== userId) throw new Error("Forbidden");
    await ctx.db.delete(commentId);
  },
});

export const resolveThread = mutation({
  args: { threadId: v.string(), resolved: v.optional(v.boolean()) },
  handler: async (ctx, { threadId, resolved }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const thread = await ctx.db
      .query("commentThreads")
      .withIndex("by_public_id", (q) => q.eq("id", threadId))
      .first();
    if (!thread) throw new Error("Thread not found");
    if (thread.creatorId && thread.creatorId !== userId) throw new Error("Forbidden");
    const newResolved = resolved ?? true;
    await ctx.db.patch(thread._id, { resolved: newResolved });
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    await Promise.all(comments.map((c) => ctx.db.patch(c._id, { resolved: newResolved })));
  },
});
```

### Phase 3 — Templates helpers (new file: convex/templates.ts)

Checklist
- [ ] Provide helpers to fetch “blank” and “project_brief” templates
- [ ] Provide internal create-from-template function used by documents/projects
- [ ] Use PM snapshots to seed pages and ProseMirror docs
Checklist
- [x] Provide helpers to fetch “blank” and “project_brief” templates
- [x] Provide internal create-from-template function used by documents/projects
- [x] Use PM snapshots to seed pages and ProseMirror docs

Add `convex/templates.ts`:

```ts
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import type { MutationCtx } from "./_generated/server";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateBlankTemplate(ctx: MutationCtx) {
  let tpl = await ctx.db.query("documentTemplates").withIndex("by_key", q => q.eq("key", "blank")).first();
  if (!tpl) {
    const id = await ctx.db.insert("documentTemplates", {
      key: "blank",
      name: "Blank",
      description: "A blank document with a single empty page.",
      snapshot: {
        documentTitle: "Untitled",
        pages: [
          {
            title: "Untitled",
            order: 0,
            content: JSON.stringify({ type: "doc", content: [] }),
          },
        ],
      },
      isActive: true,
      isPublic: false,
      usageCount: 0,
      createdAt: Date.now(),
    } as any);
    tpl = await ctx.db.get(id);
  }
  return tpl!;
}

export async function getProjectBriefTemplate(ctx: MutationCtx) {
  const tpl = await ctx.db.query("documentTemplates")
    .withIndex("by_category", q => q.eq("category", "project_brief"))
    .first();
  return tpl ?? null;
}

export async function createDocumentFromTemplateInternal(
  ctx: MutationCtx,
  args: {
    title: string;
    templateId?: string;
    templateKey?: string; // e.g., "blank"
    documentType?: "project_brief" | "blank" | "meeting_notes" | "wiki_article" | "resource_doc" | "retrospective";
    projectId?: string;
    clientId?: string;
    departmentId?: string;
  }
): Promise<{ documentId: any; pageIds: any[]; docIds: string[] }> {
  const now = Date.now();

  // Resolve template
  let template: any = null;
  if (args.templateId) template = await ctx.db.get(args.templateId as any);
  if (!template && args.templateKey) {
    template = await ctx.db.query("documentTemplates").withIndex("by_key", q => q.eq("key", args.templateKey!)).first();
  }
  if (!template && args.documentType === "project_brief") {
    template = await getProjectBriefTemplate(ctx);
  }
  if (!template) {
    template = await getOrCreateBlankTemplate(ctx);
  }

  // Create document
  const documentId = await ctx.db.insert("documents", {
    title: args.title,
    createdAt: now,
    projectId: args.projectId as any,
    clientId: args.clientId as any,
    departmentId: args.departmentId as any,
    documentType: (args.documentType ?? "blank") as any,
    status: "draft",
  } as any);

  // Create pages and ProseMirror docs
  const snapshot = (template as any).snapshot ?? { pages: [{ title: args.title, order: 0, content: JSON.stringify({ type: "doc", content: [] }) }] };
  const pageIds: any[] = [];
  const docIds: string[] = [];

  for (const page of (snapshot.pages ?? [])) {
    const docId = randomId();
    let content: any = { type: "doc", content: [] };
    try { content = JSON.parse(page.content || "{}"); } catch {}
    await prosemirrorSync.create(ctx as any, docId, content);
    const pageId = await ctx.db.insert("documentPages", {
      documentId,
      parentPageId: undefined,
      docId,
      title: page.title ?? "Untitled",
      icon: page.icon,
      order: page.order ?? 0,
      createdAt: now,
    } as any);
    pageIds.push(pageId);
    docIds.push(docId);
  }

  return { documentId, pageIds, docIds };
}
```

### Phase 4 — Documents API (convex/documents.ts)

Checklist
- [ ] Keep blank create path
- [ ] Add create-from-template path using helpers
- [ ] Maintain existing list/rename/remove APIs
Checklist
- [x] Keep blank create path
- [x] Add create-from-template path using helpers
- [x] Maintain existing list/rename/remove APIs

Replace the `create` mutation with this version (rest of file can remain as-is):

```ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { createDocumentFromTemplateInternal, getOrCreateBlankTemplate } from "./templates";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

export const create = mutation({
  args: { title: v.string(), templateKey: v.optional(v.string()), documentType: v.optional(v.string()), projectId: v.optional(v.id("projects")) },
  handler: async (ctx, { title, templateKey, documentType, projectId }) => {
    // Default to blank template if none provided
    const tplKey = templateKey ?? "blank";
    // Ensure the template exists (creates 'blank' if missing)
    if (tplKey === "blank") {
      await getOrCreateBlankTemplate(ctx);
    }
    const { documentId } = await createDocumentFromTemplateInternal(ctx, {
      title,
      templateKey: tplKey,
      documentType: (documentType as any) ?? (tplKey === "blank" ? "blank" : undefined),
      projectId: projectId as any,
    });
    return { documentId };
  },
});
```

### Phase 5 — Projects API (convex/projects.ts)

Checklist
- [ ] Provide a simple “create project + project brief document” mutation for prototype
- [ ] Ensure it links the created document to the project
- [ ] Return documentId for redirect to editor
Checklist
- [x] Provide a simple “create project + project brief document” mutation for prototype
- [x] Ensure it links the created document to the project
- [x] Return documentId for redirect to editor

Add a new file `convex/projects.ts`:

```ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { createDocumentFromTemplateInternal, getProjectBriefTemplate, getOrCreateBlankTemplate } from "./templates";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createProjectWithBrief = mutation({
  args: { title: v.string(), clientName: v.optional(v.string()), departmentName: v.optional(v.string()) },
  handler: async (ctx, { title, clientName, departmentName }) => {
    const userId = await getAuthUserId(ctx);
    const now = Date.now();

    // Ensure or create a default client/department for convenience in prototype
    let client = await ctx.db.query("clients").first();
    if (!client) {
      const cid = await ctx.db.insert("clients", { name: clientName ?? "Demo Client", createdAt: now } as any);
      client = await ctx.db.get(cid);
    }
    let department = await ctx.db.query("departments").first();
    if (!department) {
      const did = await ctx.db.insert("departments", { name: departmentName ?? "General", createdAt: now } as any);
      department = await ctx.db.get(did);
    }

    // Create empty project
    const projectId = await ctx.db.insert("projects", {
      title,
      clientId: (client as any)?._id,
      departmentId: (department as any)?._id,
      visibility: "organization",
      createdBy: userId as any,
      createdAt: now,
      updatedAt: now,
    } as any);

    // Ensure a project brief template exists; fall back to blank if not
    const pb = await getProjectBriefTemplate(ctx);
    if (!pb) {
      await getOrCreateBlankTemplate(ctx);
    }

    // Create linked document from template (project_brief or blank)
    const { documentId } = await createDocumentFromTemplateInternal(ctx, {
      title,
      documentType: "project_brief",
      projectId: projectId as any,
      clientId: (client as any)?._id as any,
      departmentId: (department as any)?._id as any,
    });

    // Link project -> document
    await ctx.db.patch(projectId, { documentId });

    return { projectId, documentId };
  },
});
```

### Phase 6 — UI: add “New Project” alongside “New” (src/app/(dashboard)/docs/page.tsx)

Checklist
- [ ] Add a “New Project” button next to “New”
- [ ] On click: prompt for title; call `projects.createProjectWithBrief`; redirect to editor for returned documentId
Checklist
- [x] Add a “New Project” button next to “New”
- [x] On click: prompt for title; call `projects.createProjectWithBrief`; redirect to editor for returned documentId

Edits in `src/app/(dashboard)/docs/page.tsx` (imports and button):

```tsx
// Add imports
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Inside the component
const createProjectWithBrief = useMutation(api.projects.createProjectWithBrief);

// In the header action buttons, add next to the existing "New" button
<button
  className="inline-flex h-9 items-center rounded-md border px-3"
  onClick={async () => {
    const title = prompt("New project title", "Untitled Project") || "Untitled Project";
    const { documentId } = await createProjectWithBrief({ title });
    router.push(`/editor/${documentId}`);
  }}
>
  New Project
</button>
```

### Phase 7 — Validation

Checklist
- [ ] New → creates blank doc, opens editor, autosave works
- [ ] New Project → creates project + project brief doc, opens editor
- [ ] Document comments: create/list/reply/resolve still work
- [ ] Task comments: listByTask works; mentions/notifications populate
- [ ] Presence cursors still update
- [ ] Two tabs collaborate on same docId
Checklist
- [x] New → creates blank doc, opens editor, autosave works
- [x] New Project → creates project + project brief doc, opens editor
- [x] Document comments: create/list/reply/resolve still work
- [x] Task comments: listByTask works; mentions/notifications populate
- [x] Presence cursors still update
- [x] Two tabs collaborate on same docId

### Agent Execution Prompt (prototype-only)

Use this prompt to drive an agent that only has access to the prototype repo:

```
You are updating a Next.js + Convex prototype to align with a main app’s editor-related features.

Do the following EXACTLY, in order:

1) Edit convex/schema.ts:
   - Update or add the following tables and indexes:
     - users (ensure email/name/image/role/clientId/departmentIds fields; index by_email)
     - comments (fields + indexes by_doc, by_thread, by_block, by_task, by_doc_resolved)
     - commentThreads (fields + indexes by_doc, by_block, by_task, by_public_id)
     - notifications (full table with indexes by_user, by_user_unread, by_type, by_created_at, by_related_document, by_related_task, by_task)
     - documentTemplates (include key?, category?, snapshot.{pages[]}, indexes by_key, by_category, by_active)
     - documents (ensure projectId/clientId/departmentId/documentType/status and indexes by_project/by_type)
     - documentPages (ensure index by_docId)
     - tasks (minimal; index by_project)
     - projects (minimal; indexes by_client/by_department/by_status)
   - Use the code provided in docs/prototype-alignment-plan.md Phase 1.
   - Check off each checklist item in docs/prototype-alignment-plan.md when done.

2) Replace convex/comments.ts with the merged implementation from docs/prototype-alignment-plan.md Phase 2.
   - Keep existing editor method names intact.
   - Check off the checklist items.

3) Create convex/templates.ts with the exact code from docs/prototype-alignment-plan.md Phase 3.
   - Check off the checklist items.

4) In convex/documents.ts:
   - Replace the create mutation with the code from docs/prototype-alignment-plan.md Phase 4.
   - Leave other exports as they are, unless conflicts arise.
   - Check off the checklist items.

5) Create convex/projects.ts with the code from docs/prototype-alignment-plan.md Phase 5.
   - Check off the checklist items.

6) Update src/app/(dashboard)/docs/page.tsx per docs/prototype-alignment-plan.md Phase 6.
   - Add imports, wire useMutation(api.projects.createProjectWithBrief), add the New Project button, and redirect to /editor/${documentId}.
   - Check off the checklist items.

7) Run type-checks and build:
   - npm run type-check
   - npm run build
   - Fix any typing or import paths.

8) Validate end-to-end per Phase 7 in docs/prototype-alignment-plan.md.
   - Check off each validation item.

Constraints:
- Do not reference or access the strideos repo; use only code provided in docs/prototype-alignment-plan.md.
- Preserve the prototype editor component and its lifecycle.
- Keep method names used by the editor unchanged.
```
