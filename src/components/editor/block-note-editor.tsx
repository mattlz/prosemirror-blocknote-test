"use client";
import { useEffect, useMemo, useRef, useCallback, type ReactElement } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { SuggestionMenuController } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteEditor, nodeToBlock, filterSuggestionItems } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ConvexThreadStore } from "@/app/comments/convex-thread-store";
import { useAuthToken } from "@convex-dev/auth/react";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { createRemoteCursorPlugin } from "@/components/editor";
import { customSchema, type CustomBlockNoteEditor } from "./custom-blocks/custom-schema";
import { getCustomSlashMenuItems } from "./custom-blocks/slash-menu-items";

const INITIAL_DOCUMENT: { type: string; content: unknown[] } = { type: "doc", content: [] };

interface BlockNoteEditorProps {
	docId: string;
	onEditorReady?: (editor: CustomBlockNoteEditor) => void;
	showRemoteCursors?: boolean;
	editable?: boolean;
	theme?: "light" | "dark";
}

export function BlockNoteEditorComponent({ docId, onEditorReady, showRemoteCursors = true, editable = true, theme = "light" }: BlockNoteEditorProps): ReactElement {
	const presence = useQuery(api.presence.list, { docId }) ?? [];
	const me = useQuery(api.comments.me, {});
	const userId = (me as any)?.userId ?? null;
	const userEmail = (me as any)?.email ?? null;
	const threadsForDoc = (useQuery(api.comments.listByDoc, { docId, includeResolved: true }) ?? []) as Array<{ thread: any; comments: any[] }>;

	// Keep latest presence in a ref so the plugin can read it without recreating the editor
	const presenceRef = useRef<any[]>(presence as any);
	useEffect(() => { 
		presenceRef.current = presence as any;
	}, [presence]);

	// Keep userId in a ref to avoid editor recreation
	const userIdRef = useRef<string | null>(null);
	useEffect(() => { 
		userIdRef.current = userId;
	}, [userId]);

	const presenceMap = useMemo(() => {
		const map: Record<string, { name: string; color: string }> = {};
		for (const p of presence as any[]) {
			map[(p as any).userId] = { name: (p as any).name, color: (p as any).color };
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
			createThreadRef.current({ docId: d, blockId: blockId ?? "", content }) as any,
		createComment: ({ docId: d, blockId, threadId, content }) =>
			addCommentRef.current({ docId: d, blockId: blockId ?? "", threadId, content }) as any,
		updateComment: ({ commentId, content }) =>
			updateCommentRef.current({ commentId: commentId as any, content }) as any,
		deleteComment: ({ commentId }) =>
			deleteCommentRef.current({ commentId: commentId as any }) as any,
		resolveThread: ({ threadId, resolved }) =>
			resolveThreadRef.current({ threadId, resolved }) as any,
	}), [docId]); // Only depend on docId, refs always point to latest mutations

	// Add ref for showRemoteCursors to prevent editor recreation when toggled
	const showRemoteCursorsRef = useRef(showRemoteCursors);
	useEffect(() => { showRemoteCursorsRef.current = showRemoteCursors; }, [showRemoteCursors]);

	const tiptapSync = useTiptapSync(api.example, docId, { snapshotDebounceMs: 1000 });

	// Expose a manual save that mirrors autosave by submitting a snapshot immediately
	const latestVersion = useQuery(api.example.latestVersion, { id: docId }) as number | null;
	const submitSnapshot = useMutation(api.example.submitSnapshot);

	const editorFromSync = useMemo(() => {
		if (tiptapSync.initialContent === null) return null;
		// Headless editor for PM->BlockNote conversion only (no comments in headless)
		// The TipTap snapshot may include a PM mark type named "comment" which
		// doesn't exist in BlockNote's headless schema. Strip those marks first.
		function stripUnsupportedMarks(node: any): any {
			if (!node || typeof node !== "object") return node;
			const clone: any = { ...node };
			if (Array.isArray(clone.marks)) {
				clone.marks = clone.marks.filter((m: any) => m?.type !== "comment");
			}
			if (Array.isArray(clone.content)) {
				clone.content = clone.content.map(stripUnsupportedMarks);
			}
			return clone;
		}
		const cleanedInitial = stripUnsupportedMarks(tiptapSync.initialContent as any);
		const headless = BlockNoteEditor.create({ schema: customSchema, resolveUsers, _headless: true });
		const blocks: any[] = [];
		const pmNode = headless.pmSchema.nodeFromJSON(cleanedInitial as any);
		if ((pmNode as any).firstChild) {
			(pmNode as any).firstChild.descendants((node: any) => {
				blocks.push(nodeToBlock(node, headless.pmSchema));
				return false;
			});
		}
		const created = BlockNoteEditor.create({
			schema: customSchema,
			resolveUsers,
			comments: { threadStore: threadStore as any },
			_tiptapOptions: {
				extensions: [tiptapSync.extension],
			},
			_extensions: {
				remoteCursors: () => ({ plugin: createRemoteCursorPlugin(() => {
					if (!showRemoteCursorsRef.current) return [] as any[]; // Use ref instead of prop
					const filtered = (presenceRef.current as any[]).filter(p => p.userId !== userIdRef.current);
					return filtered;
				}) }),
			},
			initialContent: blocks.length > 0 ? blocks : undefined,
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
			const pos = (editor as any)?.prosemirrorState?.selection?.head ?? 0;
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
		(editorInst as any).manualSave = async (): Promise<void> => {
			try {
				const pmEditor = (editorInst as any)?.prosemirrorEditor;
				const docJson = pmEditor?.state?.doc?.toJSON();
				if (!docJson) return;
				const version: number = (latestVersion ?? 0) as number;
				await submitSnapshot({ id: docId, version, content: JSON.stringify(docJson) } as any);
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
		
		const handleTransaction = (transaction: any) => {
			if (transaction.docChanged) {
				console.log("📝 EDITOR TRANSACTION:", {
					docId,
					stepCount: transaction.steps.length,
					stepTypes: transaction.steps.map((s: any) => s.stepType || 'unknown'),
					timestamp: new Date().toISOString(),
					docSize: transaction.doc.content.size
				});
			}
		};
		
		// Listen to ProseMirror transactions
		const editor = (editorInst as any)?.prosemirrorEditor;
		if (editor) {
			editor.on('transaction', handleTransaction);
			console.log("🎧 EDITOR TRANSACTION LISTENER ATTACHED:", { docId });
		}
		
		return () => {
			if (editor) {
				editor.off('transaction', handleTransaction);
				console.log("🎧 EDITOR TRANSACTION LISTENER REMOVED:", { docId });
			}
		};
	}, [editorInst, docId]);

	const lastMarkedRef = useRef<Set<string>>(new Set());
	useEffect(() => {
		if (!editorInst) return;
		const current = new Set<string>((threadsForDoc as any[]).map((t: any) => t.thread.blockId));
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
		(threadStore as any).setThreadsFromConvex(threadsForDoc as any);
	}, [threadsForDoc, threadStore, editorInst]);

	return (
		<div className="mt-4" data-editor-theme={theme}>
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