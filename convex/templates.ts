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

