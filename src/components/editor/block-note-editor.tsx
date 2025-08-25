"use client";
import { useEffect, useMemo, useRef, useCallback, type ReactElement } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { SuggestionMenuController } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteEditor, nodeToBlock, filterSuggestionItems } from "@blocknote/core";
import type { PMNode } from "@/types";
import { useEditorPresence, useEditorUser, useEditorComments, useEditorSync } from "@/hooks";
import { useAuthToken } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { createRemoteCursorPlugin } from "@/components/editor";
import { customSchema, type CustomBlockNoteEditor } from "./custom-blocks/custom-schema";
import { getCustomSlashMenuItems } from "./custom-blocks/slash-menu-items";

interface BlockNoteEditorProps {
	/** Unique identifier for the document to edit */
	docId: string;
	/** Callback fired when the editor is fully initialized and ready */
	onEditorReady?: (editor: CustomBlockNoteEditor) => void;
	/** Whether to display other users' cursors in real-time */
	showRemoteCursors?: boolean;
	/** Whether the editor content can be modified */
	editable?: boolean;
	/** Visual theme for the editor */
	theme?: "light" | "dark";
}

/**
 * BlockNoteEditorComponent - A collaborative rich text editor with real-time sync
 * 
 * @remarks
 * This component provides a full-featured collaborative editor built on BlockNote
 * with real-time synchronization via Convex, presence awareness, and commenting.
 * 
 * Features:
 * - Real-time collaborative editing
 * - Auto-save with manual save capability
 * - Comments and threaded discussions
 * - Presence awareness (remote cursors)
 * - Custom blocks (alerts, tables, etc.)
 * - Light/dark theme support
 * 
 * @param props - Editor configuration options
 * @returns A collaborative editor component
 * 
 * @example
 * ```tsx
 * <BlockNoteEditorComponent
 *   docId="doc-123"
 *   onEditorReady={(editor) => console.log('Editor ready!')}
 *   showRemoteCursors={true}
 *   theme="light"
 * />
 * ```
 */
export function BlockNoteEditorComponent({ docId, onEditorReady, showRemoteCursors = true, editable = true, theme = "light" }: BlockNoteEditorProps): ReactElement {
	// Extract user data
	const { userId, userEmail, userIdRef } = useEditorUser();
	
	// Extract presence data
	const { presence, presenceRef, presenceMapRef } = useEditorPresence(docId);
	
	// Extract comments data
	const { threadsForDoc, threadStore } = useEditorComments(docId, userId);
	
	// Extract sync functionality
	const { tiptapSync, latestVersion, manualSave } = useEditorSync(docId);

	// Stable resolveUsers that reads from the ref (no editor re-instantiation on presence change)
	const resolveUsers = useCallback(async (userIds: string[]): Promise<Array<{ id: string; username: string; avatarUrl: string }>> => {
		return userIds.map((id) => ({ id, username: presenceMapRef.current[id]?.name ?? "User", avatarUrl: "" }));
	}, []);


	const editorFromSync = useMemo(() => {
		if (tiptapSync.initialContent === null) return null;
		// Headless editor for PM->BlockNote conversion only (no comments in headless)
		// The TipTap snapshot may include a PM mark type named "comment" which
		// doesn't exist in BlockNote's headless schema. Strip those marks first.
		function stripUnsupportedMarks(node: unknown): unknown {
			if (!node || typeof node !== "object") return node;
			const clone = { ...node as PMNode };
			if (Array.isArray(clone.marks)) {
				clone.marks = clone.marks.filter(m => m?.type !== "comment");
			}
			if (Array.isArray(clone.content)) {
				clone.content = clone.content.map(stripUnsupportedMarks) as PMNode[];
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
		return BlockNoteEditor.create({
			schema: customSchema,
			resolveUsers,
			comments: { threadStore: threadStore as any },
			_tiptapOptions: {
				extensions: [tiptapSync.extension],
			},
			_extensions: {
				remoteCursors: () => ({ plugin: createRemoteCursorPlugin(() => {
					if (!showRemoteCursors) return [] as any[];
					const filtered = (presenceRef.current as any[]).filter(p => p.userId !== userIdRef.current);
					return filtered;
				}) }),
			},
			initialContent: blocks.length > 0 ? blocks : undefined,
		});
	// Only re-create when initial snapshot or thread store changes
	}, [tiptapSync.initialContent, resolveUsers, threadStore, showRemoteCursors]);

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

	const editorInst = (sync as any)?.editor as CustomBlockNoteEditor | null;
	useEffect(() => {
		if (onEditorReady && editorInst) onEditorReady(editorInst);
	}, [editorInst, onEditorReady]);

	// Attach a manualSave method onto the editor instance so external UI can trigger it
	useEffect(() => {
		if (!editorInst) return;
		(editorInst as any).manualSave = async (): Promise<void> => {
			try {
				await manualSave(editorInst);
				if (typeof window !== "undefined") {
					window.dispatchEvent(new CustomEvent("doc-saved", { detail: { docId, ts: Date.now(), source: "manual" } }));
				}
			} catch {
				if (typeof window !== "undefined") {
					window.dispatchEvent(new CustomEvent("doc-save-error", { detail: { docId, ts: Date.now(), source: "manual" } }));
				}
			}
		};
	}, [editorInst, manualSave, docId]);

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
			{(sync as any)?.isLoading ? (
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
				<div style={{ padding: 16 }}>Editor not ready</div>
			)}
		</div>
	);
}

export { BlockNoteEditorComponent as BlockNoteEditor };