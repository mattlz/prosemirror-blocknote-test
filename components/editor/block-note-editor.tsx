"use client";
import { useEffect, useMemo, useRef, useCallback, type ReactElement } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteEditor, nodeToBlock } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ConvexThreadStore } from "@/app/comments/convex-thread-store";
import { useAuthToken } from "@convex-dev/auth/react";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { createRemoteCursorPlugin } from "@/components/editor";

interface BlockNoteEditorProps {
	docId: string;
	onEditorReady?: (editor: BlockNoteEditor) => void;
}

export function BlockNoteEditorComponent({ docId, onEditorReady }: BlockNoteEditorProps): ReactElement {
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

	const threadStore = useMemo(() => new ConvexThreadStore(docId, {
		userId: userId || "current",
		createThread: ({ docId: d, blockId, content }) => createThreadMutation({ docId: d, blockId: blockId ?? "", content }) as any,
		createComment: ({ docId: d, blockId, threadId, content }) => addCommentMutation({ docId: d, blockId: blockId ?? "", threadId, content }) as any,
		updateComment: ({ commentId, content }) => updateCommentMutation({ commentId: commentId as any, content }) as any,
		deleteComment: ({ commentId }) => deleteCommentMutation({ commentId: commentId as any }) as any,
		resolveThread: ({ threadId, resolved }) => resolveThreadMutation({ threadId, resolved }) as any,
	}), [docId, createThreadMutation, addCommentMutation, updateCommentMutation, deleteCommentMutation, resolveThreadMutation]);

	const tiptapSync = useTiptapSync(api.example, docId, { snapshotDebounceMs: 1000 });

	const editorFromSync = useMemo(() => {
		if (tiptapSync.initialContent === null) return null;
		// Headless editor for PM->BlockNote conversion only (no comments in headless)
		const headless = BlockNoteEditor.create({ resolveUsers, _headless: true });
		const blocks: any[] = [];
		const pmNode = headless.pmSchema.nodeFromJSON(tiptapSync.initialContent as any);
		if ((pmNode as any).firstChild) {
			(pmNode as any).firstChild.descendants((node: any) => {
				blocks.push(nodeToBlock(node, headless.pmSchema));
				return false;
			});
		}
		return BlockNoteEditor.create({
			resolveUsers,
			comments: { threadStore: threadStore as any },
			_tiptapOptions: {
				extensions: [tiptapSync.extension],
			},
			_extensions: {
				remoteCursors: () => ({ plugin: createRemoteCursorPlugin(() => {
					// Filter out current user's cursor
					const filtered = (presenceRef.current as any[]).filter(p => p.userId !== userIdRef.current);
					return filtered;
				}) }),
			},
			initialContent: blocks.length > 0 ? blocks : undefined,
		});
	// Only re-create when initial snapshot or thread store changes
	}, [tiptapSync.initialContent, resolveUsers, threadStore]);

	const sync = useMemo(() => ({
		editor: editorFromSync,
		isLoading: tiptapSync.isLoading,
		create: tiptapSync.create,
	}), [editorFromSync, tiptapSync.isLoading, tiptapSync.create]);

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
			const pos = (sync as any)?.editor?.prosemirrorState?.selection?.head ?? 0;
			heartbeat({ docId, cursor: String(pos), name, color }).catch(() => {});
		}, 1000);
		return () => { active = false; clearInterval(interval); };
	}, [docId, heartbeat, token, (sync as any)?.editor]);

	const editorInst: any = (sync as any)?.editor;
	useEffect(() => {
		if (onEditorReady && editorInst) onEditorReady(editorInst);
	}, [editorInst, onEditorReady]);

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
						el.classList.remove("ring-1", "ring-amber-400");
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
				el.classList.add("ring-1", "ring-amber-400");
				el.setAttribute("data-has-comment", "1");
				lastMarkedRef.current.add(id);
			}
		}
		(threadStore as any).setThreadsFromConvex(threadsForDoc as any);
	}, [threadsForDoc, threadStore, editorInst]);

	return (
		<div className="mt-4">
			{(sync as any)?.isLoading ? (
				<p style={{ padding: 16 }}>Loading…</p>
			) : editorInst ? (
				<BlockNoteView editor={editorInst} />
			) : (
				<div style={{ padding: 16 }}>Editor not ready</div>
			)}
		</div>
	);
}

export { BlockNoteEditorComponent as BlockNoteEditor };