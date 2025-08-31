import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { QueryCtx, MutationCtx } from "./_generated/server";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

async function ensurePageRead(ctx: QueryCtx, id: string) {
	const page = await ctx.db.query("documentPages").withIndex("by_docId", q => q.eq("docId", id)).first();
	if (!page) throw new Error("Unknown page");
}

async function ensurePageWrite(ctx: MutationCtx, id: string) {
	console.log("🔍 ENSURE PAGE WRITE CHECK:", {
		docId: id,
		timestamp: new Date().toISOString()
	});
	
	const page = await ctx.db.query("documentPages").withIndex("by_docId", q => q.eq("docId", id)).first();
	
	console.log("🔍 PAGE LOOKUP RESULT:", {
		docId: id,
		pageFound: !!page,
		pageId: page?._id,
		pageDocId: page?.docId,
		pageTitle: page?.title,
		timestamp: new Date().toISOString()
	});
	
	if (!page) {
		console.error("❌ PAGE NOT FOUND FOR WRITE:", {
			docId: id,
			timestamp: new Date().toISOString()
		});
		throw new Error("Unknown page");
	}
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
		console.log("🔄 SNAPSHOT SUBMITTED:", {
			docId: id,
			version,
			snapshotLength: snapshot?.length || 0,
			timestamp: new Date().toISOString()
		});
		
		// naive: pull first heading text to use as title
		try {
			const content = JSON.parse(snapshot);
			console.log("📄 SNAPSHOT CONTENT:", {
				docId: id,
				contentKeys: Object.keys(content || {}),
				hasContent: !!content?.content,
				contentLength: content?.content?.length || 0
			});
			
			const firstHeading = content?.content?.find((n: any) => n.type === "heading")?.content?.[0]?.text;
			if (typeof firstHeading === "string" && firstHeading.length > 0) {
				console.log("📝 EXTRACTED HEADING:", {
					docId: id,
					heading: firstHeading
				});
				
				const page = await ctx.db.query("documentPages").withIndex("by_docId", q => q.eq("docId", id)).first();
				if (page && page.title !== firstHeading) {
					console.log("🔄 UPDATING PAGE TITLE:", {
						docId: id,
						oldTitle: page.title,
						newTitle: firstHeading
					});
					await ctx.db.patch(page._id, { title: firstHeading });
				}
			}
		} catch (error) {
			console.error("❌ ERROR PARSING SNAPSHOT:", {
				docId: id,
				error: error instanceof Error ? error.message : String(error),
				snapshot: snapshot?.substring(0, 200) + "..." // First 200 chars
			});
		}
	},
});

