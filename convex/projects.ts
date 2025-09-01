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

