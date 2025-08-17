"use client";
import { useEffect, useMemo, useRef, type ReactElement } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteEditor, nodeToBlock } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ConvexThreadStore } from "@/app/comments/convex-thread-store";
import { useAuthToken } from "@convex-dev/auth/react";
import { usePresence } from "@/hooks";
import { useBlockNoteEditor as useEditorInit } from "@/hooks";
import { createRemoteCursorPlugin } from "@/components/editor";

interface BlockNoteEditorProps {
	docId: string;
	onEditorReady?: (editor: BlockNoteEditor) => void;
}

export function BlockNoteEditorComponent({ docId, onEditorReady }: BlockNoteEditorProps): ReactElement {
	const { presence, heartbeat } = usePresence(docId);
	const threadsForDoc = (useQuery(api.comments.listByDoc, { docId, includeResolved: true }) ?? []) as Array<{ thread: any; comments: any[] }>;

	const presenceMap = useMemo(() => {
		const map: Record<string, { name: string; color: string }> = {};
		for (const p of presence as any[]) {
			map[(p as any).userId] = { name: (p as any).name, color: (p as any).color };
		}
		return map;
	}, [presence]);

	const resolveUsers = async (userIds: string[]): Promise<Array<{ id: string; username: string; avatarUrl: string }>> => {
		return userIds.map((id) => ({ id, username: presenceMap[id]?.name ?? "User", avatarUrl: "" }));
	};

	const createThreadMutation = useMutation(api.comments.createThread);
	const addCommentMutation = useMutation(api.comments.createComment);
	const updateCommentMutation = useMutation(api.comments.updateComment);
	const deleteCommentMutation = useMutation(api.comments.deleteComment);
	const resolveThreadMutation = useMutation(api.comments.resolveThread);

	const threadStore = useMemo(() => new ConvexThreadStore(docId, {
		userId: "current",
		createThread: ({ docId: d, blockId, content }) => createThreadMutation({ docId: d, blockId: blockId ?? "", content }) as any,
		createComment: ({ docId: d, blockId, threadId, content }) => addCommentMutation({ docId: d, blockId: blockId ?? "", threadId, content }) as any,
		updateComment: ({ commentId, content }) => updateCommentMutation({ commentId: commentId as any, content }) as any,
		deleteComment: ({ commentId }) => deleteCommentMutation({ commentId: commentId as any }) as any,
		resolveThread: ({ threadId, resolved }) => resolveThreadMutation({ threadId, resolved }) as any,
	}), [docId, createThreadMutation, addCommentMutation, updateCommentMutation, deleteCommentMutation, resolveThreadMutation]);

	// Initialize editor via hook
	const tiptapInit = useEditorInit(docId, resolveUsers, threadStore);
	const editorFromSync = useMemo(() => {
		if ((tiptapInit as any)?.editor === null) return null;
		// Add remote cursor plugin and initial content mapping
		const base = (tiptapInit as any)?.editor;
		if (!base) return null;
		// The hook created BlockNote editor with tiptap extension already, so we just return it
		// and rely on presence cursor plugin via _extensions below.
		return BlockNoteEditor.create({
			resolveUsers,
			comments: { threadStore: threadStore as any },
			_tiptapOptions: { extensions: [(tiptapInit as any).editor?._tiptapOptions?.extensions?.[0]] },
			_extensions: { remoteCursors: () => ({ plugin: createRemoteCursorPlugin(() => presence as any) }) },
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [(tiptapInit as any)?.editor, resolveUsers, threadStore, presence]);

	const sync = useMemo(() => ({
		editor: editorFromSync,
		isLoading: (tiptapInit as any)?.isLoading,
	}), [editorFromSync, (tiptapInit as any)?.isLoading]);

	const token = useAuthToken();
	useEffect(() => {
		if (!token) return;
		let active = true;
		const color = `hsl(${Math.floor(Math.random() * 360)} 70% 45%)`;
		const name = `User`;
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
