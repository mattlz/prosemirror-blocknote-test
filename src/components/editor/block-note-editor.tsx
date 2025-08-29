"use client";
import { useEffect, useMemo, useRef, useCallback, type ReactElement } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { SuggestionMenuController } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteEditor, nodeToBlock, filterSuggestionItems } from "@blocknote/core";
import type { JSONContent } from "@tiptap/core";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ConvexThreadStore } from "@/app/comments/convex-thread-store";
import { useAuthToken } from "@convex-dev/auth/react";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { createRemoteCursorPlugin } from "@/components/editor";
import { customSchema, type CustomBlockNoteEditor } from "./custom-blocks/custom-schema";
import { getCustomSlashMenuItems } from "./custom-blocks/slash-menu-items";
import type { PresenceData } from "@/types/presence";
import type { Thread, Comment } from "@/types/comments";
import type { Id } from "@/convex/_generated/dataModel";

const INITIAL_DOCUMENT: JSONContent = { type: "doc", content: [] };

interface BlockNoteEditorProps {
	docId: string;
	onEditorReady?: (editor: CustomBlockNoteEditor) => void;
	showCursorLabels?: boolean;
	editable?: boolean;
	theme?: "light" | "dark";
}

export function BlockNoteEditorComponent({ docId, onEditorReady, showCursorLabels = true, editable = true, theme = "light" }: BlockNoteEditorProps): ReactElement {
	const presence = useQuery(api.presence.list, { docId }) as PresenceData[] | undefined;
	const me = useQuery(api.comments.me, {}) as { userId: string | null; email: string | null } | undefined;
	const userId = me?.userId ?? null;
	const userEmail = me?.email ?? null;
	const threadsForDocRaw = useQuery(api.comments.listByDoc, { docId, includeResolved: true }) as Array<{ thread: Thread; comments: Comment[] }> | undefined;
	const threadsForDoc = threadsForDocRaw ?? [];

	// Keep latest presence in a ref so the plugin can read it without recreating the editor
	const presenceRef = useRef<PresenceData[]>(presence ?? []);
	useEffect(() => { 
		presenceRef.current = presence ?? [];
	}, [presence]);

	// Keep userId in a ref to avoid editor recreation
	const userIdRef = useRef<string | null>(null);
	useEffect(() => { 
		userIdRef.current = userId;
	}, [userId]);

	const presenceMap = useMemo(() => {
		const map: Record<string, { name: string; color: string }> = {};
		for (const p of (presence ?? [])) {
			map[p.userId] = { name: p.name, color: p.color };
		}
		return map;
	}, [presence]);

	const presenceMapRef = useRef<Record<string, { name: string; color: string }>>({});
	useEffect(() => { presenceMapRef.current = presenceMap; }, [presenceMap]);

	// Stable resolveUsers that reads from the ref (no editor re-instantiation on presence change)
	const resolveUsers = useCallback(async (userIds: string[]): Promise<Array<{ id: string; username: string; avatarUrl: string }>> => {
		return userIds.map((id) => ({ id, username: presenceMapRef.current[id]?.name ?? "User", avatarUrl: "" }));
	}, []);

	const createThreadMutation = useMutation(api.comments.createThread);
	const addCommentMutation = useMutation(api.comments.createComment);
	const updateCommentMutation = useMutation(api.comments.updateComment);
	const deleteCommentMutation = useMutation(api.comments.deleteComment);
	const resolveThreadMutation = useMutation(api.comments.resolveThread);

	// Store mutations in refs to prevent threadStore recreation
	const createThreadRef = useRef(createThreadMutation);
	const addCommentRef = useRef(addCommentMutation);
	const updateCommentRef = useRef(updateCommentMutation);
	const deleteCommentRef = useRef(deleteCommentMutation);
	const resolveThreadRef = useRef(resolveThreadMutation);

	useEffect(() => { createThreadRef.current = createThreadMutation; }, [createThreadMutation]);
	useEffect(() => { addCommentRef.current = addCommentMutation; }, [addCommentMutation]);
	useEffect(() => { updateCommentRef.current = updateCommentMutation; }, [updateCommentMutation]);
	useEffect(() => { deleteCommentRef.current = deleteCommentMutation; }, [deleteCommentMutation]);
	useEffect(() => { resolveThreadRef.current = resolveThreadMutation; }, [resolveThreadMutation]);

	const threadStore = useMemo(() => new ConvexThreadStore(docId, {
		userId: userId || "current",
		createThread: ({ docId: d, blockId, content }) =>
			createThreadRef.current({ docId: d, blockId: blockId ?? "", content }),
		createComment: ({ docId: d, blockId, threadId, content }) =>
			addCommentRef.current({ docId: d, blockId: blockId ?? "", threadId, content }),
		updateComment: ({ commentId, content }) =>
			updateCommentRef.current({ commentId: commentId as unknown as Id<"comments">, content }),
		deleteComment: ({ commentId }) =>
			deleteCommentRef.current({ commentId: commentId as unknown as Id<"comments"> }),
		resolveThread: ({ threadId, resolved }) =>
			resolveThreadRef.current({ threadId, resolved }),
	}), [docId, userId]);

	const tiptapSync = useTiptapSync(api.documentSyncApi, docId, { snapshotDebounceMs: 1000 });

	// Expose a manual save that mirrors autosave by submitting a snapshot immediately
	const latestVersion = useQuery(api.documentSyncApi.latestVersion, { id: docId }) as number | null;
	const submitSnapshot = useMutation(api.documentSyncApi.submitSnapshot);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const editorFromSync = useMemo(() => {
		if (tiptapSync.initialContent === null) return null;
		// Headless editor for PM->BlockNote conversion only (no comments in headless)
		// The TipTap snapshot may include a PM mark type named "comment" which
		// doesn't exist in BlockNote's headless schema. Strip those marks first.
		type JSONNode = { marks?: Array<{ type?: string }>; content?: JSONNode[] } & Record<string, unknown>;
		function stripUnsupportedMarks(node: unknown): JSONNode | unknown {
			if (!node || typeof node !== "object") return node;
			const clone: JSONNode = { ...(node as Record<string, unknown>) } as JSONNode;
			if (Array.isArray(clone.marks)) {
				clone.marks = clone.marks.filter((m) => (m?.type ?? "") !== "comment");
			}
			if (Array.isArray(clone.content)) {
				clone.content = clone.content.map(stripUnsupportedMarks) as JSONNode[];
			}
			return clone;
		}
		const cleanedInitial = stripUnsupportedMarks(tiptapSync.initialContent as unknown) as JSONContent;
		const headless = BlockNoteEditor.create({ schema: customSchema, resolveUsers, _headless: true });
		const blocks: unknown[] = [];
		type PMNode = { firstChild?: PMNode; descendants: (f: (node: PMNode) => void | boolean) => void };
		const pmNode = headless.pmSchema.nodeFromJSON(cleanedInitial as JSONContent) as unknown as PMNode;
		if (pmNode.firstChild) {
			pmNode.firstChild.descendants((node: PMNode) => {
				// nodeToBlock types are not exported; cast to unknown
				blocks.push(nodeToBlock(node as never, headless.pmSchema));
				return false as unknown as void;
			});
		}
		const created = BlockNoteEditor.create({
			schema: customSchema,
			resolveUsers,
				comments: { threadStore },
			_tiptapOptions: {
				extensions: [tiptapSync.extension],
			},
			_extensions: {
					remoteCursors: () => ({ plugin: createRemoteCursorPlugin(() => {
						const filtered = (presenceRef.current).filter(p => p.userId !== userIdRef.current).map(p => ({
							userId: p.userId,
							name: p.name,
							color: p.color,
							cursor: p.cursor,
						}));
						return filtered;
					}, { showLabels: true }) }),
			},
				initialContent: blocks.length > 0 ? (blocks as unknown as object[]) : undefined,
		});
		// Only re-create when initial content changes (on initial load) or docId changes
		// All dynamic data (presence, cursors, comments) flows through refs
		console.log("🚀 EDITOR CREATED", { docId, timestamp: new Date().toISOString() });
		return created;
	}, [tiptapSync.initialContent, docId]); // Minimal stable deps - no dynamic values!

	// Remove unnecessary wrapper - use values directly
	const editor = editorFromSync;
	const isLoading = tiptapSync.isLoading;

	const token = useAuthToken();
	const colorRef = useRef<string>(`hsl(${Math.floor(Math.random() * 360)} 70% 45%)`);
	const nameRef = useRef<string>("User");
	
	// Update nameRef when user email becomes available
  useEffect(() => {
		if (userEmail && nameRef.current === "User") {
			nameRef.current = userEmail;
		}
	}, [userEmail]);
	
	const heartbeat = useMutation(api.presence.heartbeat);
	useEffect(() => {
		if (!token) return;
		let active = true;
		const color = colorRef.current;
		const name = nameRef.current;
		const interval = setInterval(() => {
			if (!active) return;
				type EditorStateHolder = { prosemirrorState?: { selection?: { head?: number } } };
				const pos = (editor as unknown as EditorStateHolder)?.prosemirrorState?.selection?.head ?? 0;
			heartbeat({ docId, cursor: String(pos), name, color }).catch(() => {});
		}, 1000);
		return () => { active = false; clearInterval(interval); };
	}, [docId, heartbeat, token, editor]);

	const editorInst = editor as CustomBlockNoteEditor | null;
	useEffect(() => {
		if (onEditorReady && editorInst) onEditorReady(editorInst);
	}, [editorInst, onEditorReady]);

	// Attach a manualSave method onto the editor instance so external UI can trigger it
	useEffect(() => {
		if (!editorInst) return;
			type ManualSavable = { manualSave?: () => Promise<void>; prosemirrorEditor?: { state?: { doc?: { toJSON: () => unknown } } } };
			(editorInst as unknown as ManualSavable).manualSave = async (): Promise<void> => {
			try {
			const pmEditor = (editorInst as unknown as { prosemirrorEditor?: { state?: { doc?: { toJSON: () => unknown } } } })?.prosemirrorEditor;
				const docJson = pmEditor?.state?.doc?.toJSON();
				if (!docJson) return;
				const version: number = (latestVersion ?? 0) as number;
				await submitSnapshot({ id: docId, version, content: JSON.stringify(docJson) } as unknown as { id: string; version: number; content: string });
				if (typeof window !== "undefined") {
					window.dispatchEvent(new CustomEvent("doc-saved", { detail: { docId, version: (version ?? 0) + 1, ts: Date.now(), source: "manual" } }));
				}
			} catch {
				if (typeof window !== "undefined") {
					window.dispatchEvent(new CustomEvent("doc-save-error", { detail: { docId, ts: Date.now(), source: "manual" } }));
				}
			}
		};
	}, [editorInst, latestVersion, submitSnapshot, docId]);

	// When the synced version changes (autosave or collaborative updates), broadcast a saved event
	const lastVersionRef = useRef<number | null>(null);
	useEffect(() => {
		if (typeof latestVersion !== "number") return;
		if (lastVersionRef.current === null) {
			lastVersionRef.current = latestVersion;
			return;
		}
		if (latestVersion !== lastVersionRef.current) {
			lastVersionRef.current = latestVersion;
			if (typeof window !== "undefined") {
				window.dispatchEvent(new CustomEvent("doc-saved", { detail: { docId, version: latestVersion, ts: Date.now(), source: "auto" } }));
			}
		}
	}, [latestVersion, docId]);

	// Add logging for Tiptap sync state changes
	useEffect(() => {
		console.log("🔄 TIPTAP SYNC STATE CHANGED:", {
			docId,
			isLoading: tiptapSync.isLoading,
			hasInitialContent: tiptapSync.initialContent !== null,
			initialContentLength: tiptapSync.initialContent?.length || 0,
			timestamp: new Date().toISOString()
		});
	}, [tiptapSync.isLoading, tiptapSync.initialContent, docId]);

	// Add logging for editor changes
	useEffect(() => {
		if (!editorInst) return;
		
			const handleTransaction = (transaction: { docChanged?: boolean; steps?: unknown[]; doc?: { content: { size: number } } }) => {
				if (transaction.docChanged) {
					const steps = (transaction.steps ?? []) as Array<Record<string, unknown>>;
					console.log("📝 EDITOR TRANSACTION:", {
						docId,
						stepCount: steps.length,
						stepTypes: steps.map((s) => (s as { stepType?: string }).stepType || 'unknown'),
						timestamp: new Date().toISOString(),
						docSize: (transaction.doc?.content?.size as number | undefined) ?? 0
					});
				}
		};
		
		// Listen to ProseMirror transactions
			const editor = (editorInst as unknown as { prosemirrorEditor?: { on: (event: string, cb: (tr: unknown) => void) => void; off: (event: string, cb: (tr: unknown) => void) => void } })?.prosemirrorEditor;
			if (editor) {
				const adapter = (tr: unknown) => handleTransaction(tr as { docChanged?: boolean; steps?: unknown[]; doc?: { content: { size: number } } });
				editor.on('transaction', adapter);
				console.log("🎧 EDITOR TRANSACTION LISTENER ATTACHED:", { docId });
			}
			
			return () => {
				if (editor) {
					const adapter = (tr: unknown) => handleTransaction(tr as { docChanged?: boolean; steps?: unknown[]; doc?: { content: { size: number } } });
					editor.off('transaction', adapter);
					console.log("🎧 EDITOR TRANSACTION LISTENER REMOVED:", { docId });
				}
			};
	}, [editorInst, docId]);

	const lastMarkedRef = useRef<Set<string>>(new Set());
	useEffect(() => {
		if (!editorInst) return;
			const current = new Set<string>(threadsForDoc.map((t) => t.thread.blockId));
		for (const oldId of Array.from(lastMarkedRef.current)) {
			if (!current.has(oldId)) {
				const trySelectors = [
					`[data-id="${oldId}"]`,
					`[data-block-id="${oldId}"]`,
					`[data-node-id="${oldId}"]`,
				];
				for (const sel of trySelectors) {
					const el = document.querySelector(sel) as HTMLElement | null;
					if (el) {
						el.removeAttribute("data-has-comment");
					}
				}
				lastMarkedRef.current.delete(oldId);
			}
		}
		for (const id of Array.from(current)) {
			const trySelectors = [
				`[data-id="${id}"]`,
				`[data-block-id="${id}"]`,
				`[data-node-id="${id}"]`,
			];
			let el: HTMLElement | null = null;
			for (const sel of trySelectors) {
				el = document.querySelector(sel) as HTMLElement | null;
				if (el) break;
			}
			if (el) {
				el.setAttribute("data-has-comment", "1");
				lastMarkedRef.current.add(id);
			}
		}
			threadStore.setThreadsFromConvex(threadsForDoc);
  }, [threadsForDocRaw, threadStore, editorInst]);

	return (
		<div className="mt-4" data-editor-theme={theme} data-cursor-labels={showCursorLabels ? "on" : "off"}>
			{isLoading ? (
				<p style={{ padding: 16 }}>Loading…</p>
			) : editorInst ? (
				<BlockNoteView editor={editorInst} theme={theme} slashMenu={false} editable={editable}>
					<SuggestionMenuController
						triggerCharacter="/"
						getItems={async (query) =>
							filterSuggestionItems(getCustomSlashMenuItems(editorInst as CustomBlockNoteEditor), query)
						}
					/>
				</BlockNoteView>
			) : (
				<div className="p-4">
					<button
						onClick={() => tiptapSync.create?.(INITIAL_DOCUMENT)}
						className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
					>
						Create Document
					</button>
				</div>
			)}
		</div>
	);
}

export { BlockNoteEditorComponent as BlockNoteEditor };
