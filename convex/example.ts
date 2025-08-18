import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { QueryCtx, MutationCtx } from "./_generated/server";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

async function ensurePageRead(ctx: QueryCtx, id: string) {
	const page = await ctx.db.query("pages").withIndex("by_docId", q => q.eq("docId", id)).first();
	if (!page) throw new Error("Unknown page");
}

async function ensurePageWrite(ctx: MutationCtx, id: string) {
	const page = await ctx.db.query("pages").withIndex("by_docId", q => q.eq("docId", id)).first();
	if (!page) throw new Error("Unknown page");
}

export const {
	getSnapshot,
	submitSnapshot,
	latestVersion,
	getSteps,
	submitSteps,
} = prosemirrorSync.syncApi({
	checkRead: ensurePageRead,
	checkWrite: ensurePageWrite,
	onSnapshot: async (ctx, id, snapshot, version) => {
		// naive: pull first heading text to use as title
		try {
			const content = JSON.parse(snapshot);
			const firstHeading = content?.content?.find((n: any) => n.type === "heading")?.content?.[0]?.text;
			if (typeof firstHeading === "string" && firstHeading.length > 0) {
				const page = await ctx.db.query("pages").withIndex("by_docId", q => q.eq("docId", id)).first();
				if (page && page.title !== firstHeading) {
					await ctx.db.patch(page._id, { title: firstHeading });
				}
			}
		} catch {}
	},
});


