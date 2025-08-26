"use client";
import React, { useMemo, useCallback, useEffect, memo, type ReactElement } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { SuggestionMenuController } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteEditor, nodeToBlock, filterSuggestionItems } from "@blocknote/core";
import type { PMNode } from "@/types";
import type {
	ExtendedBlockNoteEditor,
	ResolvedUser,
	PresenceUser,
	EditorPresenceResult,
	EditorCommentsResult,
	EditorSyncResult
} from "@/types/blocknote.types";
import { useEditorPresence, useEditorUser, useEditorComments, useEditorSync } from "@/hooks";
import { createRemoteCursorPlugin } from "@/components/editor";
import { customSchema, type CustomBlockNoteEditor } from "./custom-blocks/custom-schema";
import { getCustomSlashMenuItems } from "./custom-blocks/slash-menu-items";

// Extracted manager components
import { EditorSyncManager } from "./editor-sync-manager";
import { EditorPresenceManager } from "./editor-presence-manager";
import { EditorCommentManager } from "./editor-comment-manager";
import { EditorDevLogger } from "./editor-dev-logger";

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
/**
 * BlockNoteEditorComponent - A collaborative rich text editor with real-time sync
 * 
 * Now refactored to use extracted manager components following single responsibility
 * principle and optimized for performance with React.memo and proper memoization.
 */
function BlockNoteEditorComponent({ 
	docId, 
	onEditorReady, 
	showRemoteCursors = true, 
	editable = true, 
	theme = "light" 
}: BlockNoteEditorProps): ReactElement {
	// Extract user data - memoized to prevent unnecessary re-renders
	const { userId, userEmail, userIdRef } = useEditorUser();
	
	// Extract presence data
	const { presence, presenceRef, presenceMapRef } = useEditorPresence(docId) as EditorPresenceResult;
	
	// Extract comments data
	const { threadsForDoc, threadStore } = useEditorComments(docId, userId) as EditorCommentsResult;
	
	// Extract sync functionality
	const { tiptapSync, latestVersion, manualSave } = useEditorSync(docId) as EditorSyncResult;

	// Memoized resolveUsers function to prevent editor re-creation
	const resolveUsers = useCallback(async (userIds: string[]): Promise<ResolvedUser[]> => {
		return userIds.map((id) => ({ 
			id, 
			username: presenceMapRef.current[id]?.name ?? "User", 
			avatarUrl: "" 
		}));
	}, [presenceMapRef]);


	// Memoized editor creation with performance optimizations
	const editorFromSync = useMemo<ExtendedBlockNoteEditor | null>(() => {
		if (tiptapSync.initialContent === null) return null;
		
		// Helper function to clean ProseMirror content of unsupported marks
		const stripUnsupportedMarks = (node: unknown): PMNode => {
			if (!node || typeof node !== "object") return node as PMNode;
			const clone = { ...node as PMNode };
			if (Array.isArray(clone.marks)) {
				clone.marks = clone.marks.filter(m => m?.type !== "comment");
			}
			if (Array.isArray(clone.content)) {
				clone.content = clone.content.map(stripUnsupportedMarks) as PMNode[];
			}
			return clone;
		};
		
		// Clean and convert initial content
		const cleanedInitial = stripUnsupportedMarks(tiptapSync.initialContent);
		const headless = BlockNoteEditor.create({ 
			schema: customSchema, 
			resolveUsers, 
			_headless: true 
		});
		
		// Convert ProseMirror content to BlockNote blocks
		const blocks: unknown[] = [];
		const pmNode = headless.pmSchema.nodeFromJSON(cleanedInitial);
		if (pmNode.firstChild) {
			pmNode.firstChild.descendants((node) => {
				blocks.push(nodeToBlock(node, headless.pmSchema));
				return false;
			});
		}
		
		// Create main editor with collaborative features
		return BlockNoteEditor.create({
			schema: customSchema,
			resolveUsers,
			comments: { threadStore: threadStore as any },
			_tiptapOptions: {
				extensions: [tiptapSync.extension],
			},
			_extensions: {
				remoteCursors: () => ({ 
					plugin: createRemoteCursorPlugin(() => {
						if (!showRemoteCursors) return [] as PresenceUser[];
						return presenceRef.current.filter(
							(p: PresenceUser) => p.userId !== userIdRef.current
						);
					})
				}),
			},
			initialContent: blocks.length > 0 ? blocks : undefined,
		}) as ExtendedBlockNoteEditor;
	}, [tiptapSync.initialContent, resolveUsers, threadStore, showRemoteCursors, presenceRef, userIdRef]);

	// Memoized sync state to prevent unnecessary re-renders
	const syncState = useMemo(() => ({
		editor: editorFromSync,
		isLoading: tiptapSync.isLoading,
		create: tiptapSync.create,
	}), [editorFromSync, tiptapSync.isLoading, tiptapSync.create]);

	// Memoized editor ready callback
	const handleEditorReady = useCallback((editor: ExtendedBlockNoteEditor) => {
		onEditorReady?.(editor as CustomBlockNoteEditor);
	}, [onEditorReady]);

	// Current editor instance
	const editorInst = syncState.editor;
	
	// Trigger editor ready callback when editor becomes available
	useEffect(() => {
		if (editorInst) {
			handleEditorReady(editorInst);
		}
	}, [editorInst, handleEditorReady]);

	// Memoized slash menu items to prevent recreation
	const slashMenuItems = useCallback(
		async (query: string) => {
			if (!editorInst) return [];
			return filterSuggestionItems(
				getCustomSlashMenuItems(editorInst as any), 
				query
			);
		},
		[editorInst]
	);

	return (
		<>
			{/* Manager Components - Handle side effects without rendering */}
			<EditorSyncManager
				editor={editorInst}
				docId={docId}
				latestVersion={latestVersion}
				manualSave={manualSave}
			/>
			<EditorPresenceManager
				docId={docId}
				editor={editorInst}
				userEmail={userEmail}
			/>
			<EditorCommentManager
				threads={threadsForDoc}
				threadStore={threadStore}
				editor={editorInst}
			/>
			<EditorDevLogger
				docId={docId}
				editor={editorInst}
				syncState={tiptapSync}
			/>
			
			{/* Main Editor UI */}
			<div className="mt-4" data-editor-theme={theme}>
				{syncState.isLoading ? (
					<div className="flex items-center justify-center p-8">
						<div className="text-sm text-muted-foreground">Loading editor…</div>
					</div>
				) : editorInst ? (
					<BlockNoteView 
						editor={editorInst as any} 
						theme={theme} 
						slashMenu={false} 
						editable={editable}
					>
						<SuggestionMenuController
							triggerCharacter="/"
							getItems={slashMenuItems}
						/>
					</BlockNoteView>
				) : (
					<div className="flex items-center justify-center p-8">
						<div className="text-sm text-muted-foreground">Editor not ready</div>
					</div>
				)}
			</div>
		</>
	);
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedBlockNoteEditor = memo(BlockNoteEditorComponent);

// Export both the memoized and non-memoized versions
export { MemoizedBlockNoteEditor as BlockNoteEditor, BlockNoteEditorComponent };