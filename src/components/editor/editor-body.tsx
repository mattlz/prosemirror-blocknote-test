"use client";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { usePages } from "@/hooks";
import CommentsSidebar from "@/components/comments/comments-sidebar";
import { SidebarOpenButton } from "@/components/editor/editor-top-bar";
import { PageOptionsModal } from "@/components/editor/modals/page-options-modal";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { EditorSidebar } from "@/components/editor/editor-sidebar";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { useEditorDoc } from "@/hooks/editor/use-editor-doc";
import { useEditorPresence } from "@/hooks/editor/use-editor-presence";

export function EditorBody(props: { initialDocumentId?: string | null; documentId?: string | null; readOnly?: boolean; hideControls?: { back?: boolean; insert?: boolean; comments?: boolean; options?: boolean; presence?: boolean; share?: boolean } }): ReactElement {
	const [documentId] = useState<string | null>(props.initialDocumentId ?? props.documentId ?? null);
	const [pageDocId, setPageDocId] = useState<string | null>(null);
	
	const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
	const [showOpenButton, setShowOpenButton] = useState<boolean>(false);
	const [commentsOpen, setCommentsOpen] = useState<boolean>(false);
	const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
	// Presence UI state (cursor labels toggle)
	const { showCursorLabels, setShowCursorLabels } = useEditorPresence(true);
	const [pageWidth, setPageWidth] = useState<"default" | "full">("default");
	const [theme, setTheme] = useState<"light" | "dark">("light");

	const { editorRef, editorInstance, handleEditorReady, lastSavedAt, saveErrorAt, formatRelative } = useEditorDoc(pageDocId);
	const createPage = useMutation(api.pages.create);
	const setIconMutation = useMutation(api.pages.setIcon);
	const createThreadMutation = useMutation(api.comments.createThread);

	const onCreatePage = async (): Promise<void> => {
		if (!documentId) return;
		const title = prompt("New page title", "Untitled") || "Untitled";
		const { docId } = await createPage({ documentId: documentId as unknown as Id<"documents">, title });
		setPageDocId(docId);
	};

	const { pages } = usePages(documentId as unknown as Id<"documents"> | null);
	const documentsRaw = useQuery(api.documents.list, {}) as Array<{ _id: string; title: string }> | undefined;
	
	const documentTitle = useMemo(() => (documentsRaw ?? []).find((d) => d._id === documentId)?.title ?? "All docs", [documentsRaw, documentId]);
	const currentPageTitle = useMemo(() => pages.find((p) => p.docId === pageDocId)?.title ?? "Untitled", [pages, pageDocId]);

	useEffect(() => {
		if (!documentId) return;
		if (pageDocId) return;
		const topLevel = pages.filter((p) => !p.parentPageId);
		const first = topLevel.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
		if (first?.docId) setPageDocId(first.docId);
	}, [documentId, pageDocId, pages]);

	useEffect(() => {
		if (!sidebarOpen) {
			const timer = setTimeout(() => setShowOpenButton(true), 300);
			return () => clearTimeout(timer);
		} else {
			setShowOpenButton(false);
		}
	}, [sidebarOpen]);

	// Save lifecycle handled by useEditorDoc

	return (
		<div className="h-screen w-full overflow-hidden flex flex-col">
			<EditorToolbar
				documentTitle={documentTitle}
				docId={pageDocId}
				documentId={documentId}
				readOnly={!!props.readOnly}
				onToggleComments={() => setCommentsOpen((v) => !v)}
				commentsOpen={commentsOpen}
				optionsOpen={optionsOpen}
				onToggleOptions={() => setOptionsOpen((v) => !v)}
					editor={props.readOnly ? null : (editorInstance as unknown as { manualSave?: () => Promise<void> })}
				theme={theme}
			/>

			<div className="flex flex-1 relative overflow-hidden min-h-0">
				<EditorSidebar 
					sidebarOpen={sidebarOpen}
					documentId={documentId}
					pageDocId={pageDocId}
					onSelect={(id) => setPageDocId(id)}
					onCreatePage={onCreatePage}
					onCollapse={() => setSidebarOpen(false)}
					theme={theme}
					lastSavedAt={lastSavedAt}
					saveErrorAt={saveErrorAt}
					formatRelative={formatRelative}
				/>
				{showOpenButton && (
					<SidebarOpenButton onOpen={() => setSidebarOpen(true)} />
				)}
				<div className="flex-1 min-h-0">
					{!pageDocId ? (
						<div className="h-full overflow-auto p-6 text-neutral-600">{documentId ? "Select or create a page" : "No document selected"}</div>
					) : (
						<EditorCanvas
							theme={theme}
							pageWidth={pageWidth}
							currentPageTitle={currentPageTitle}
							pageDocId={pageDocId}
							showCursorLabels={showCursorLabels}
							editable={!props.readOnly}
								iconValue={pages.find((p) => p.docId === pageDocId)?.icon ?? null}
							onIconChange={(val) => {
									const page = pages.find((p) => p.docId === pageDocId);
								if (!page) return;
								setIconMutation({ pageId: page._id, icon: val ?? undefined }).catch(() => {});
							}}
							onEditorReady={handleEditorReady}
						/>
					)}
				</div>
				{commentsOpen ? (
					<CommentsSidebar 
						docId={pageDocId ?? ""}
						readOnly={!!props.readOnly}
						onJumpToBlock={(blockId: string) => {
							const viewEl = document.querySelector(".bn-editor, [data-editor-root]") as HTMLElement | null;
							// Special handling for page-level threads
							if (blockId === "page") {
								const titleEl = document.querySelector("h1.text-5xl.font-extrabold.tracking-tight") as HTMLElement | null;
								if (titleEl) {
									titleEl.scrollIntoView({ behavior: "smooth", block: "start" });
									titleEl.classList.add("ring-2", "ring-blue-500", "rounded");
									setTimeout(() => titleEl.classList.remove("ring-2", "ring-blue-500", "rounded"), 1500);
								} else {
									window.scrollTo({ top: 0, behavior: "smooth" });
								}
								return;
							}
							const trySelectors = [
								`[data-id="${blockId}"]`,
								`[data-block-id="${blockId}"]`,
								`[data-node-id="${blockId}"]`,
							];
							let el: Element | null = null;
							for (const sel of trySelectors) {
								el = (viewEl ?? document).querySelector(sel);
								if (el) break;
							}
							if (el && "scrollIntoView" in el) {
								(el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
								(el as HTMLElement).classList.add("ring-2", "ring-blue-500");
								setTimeout(() => (el as HTMLElement).classList.remove("ring-2", "ring-blue-500"), 1500);
							}
						}}
						onCreateThread={async (content: string) => {
							if (!editorRef.current || !pageDocId) return;

							let selectedId: string = "page";
								try {
									type BNEditorLike = {
										getSelectedBlocks?: () => Array<{ id?: string }>;
										blocksForSelection?: () => Array<{ id?: string }>;
										document?: Array<{ id?: string }>;
									};
									const ed = editorRef.current as BNEditorLike | null;
									const getBlocks = ed?.getSelectedBlocks ?? ed?.blocksForSelection;
									const blocks = getBlocks?.() ?? [];
									if (Array.isArray(blocks) && blocks.length > 0 && blocks[0]?.id) {
										selectedId = blocks[0]?.id ?? "page";
									} else {
										const allBlocks = ed?.document ?? [];
										if (Array.isArray(allBlocks) && allBlocks.length > 0 && allBlocks[0]?.id) {
											selectedId = allBlocks[0]?.id ?? "page";
										}
									}
								} catch {}

							await createThreadMutation({ docId: pageDocId, blockId: selectedId, content }).catch(() => {});
						}}
						theme={theme}
					/>
				) : null}
			</div>
			<PageOptionsModal
				isOpen={optionsOpen}
				onClose={() => setOptionsOpen(false)}
				showCursorLabels={showCursorLabels}
				onToggleCursorLabels={setShowCursorLabels}
				pageWidth={pageWidth}
				onChangePageWidth={setPageWidth}
				theme={theme}
				onChangeTheme={setTheme}
			/>
		</div>
	);
}

export default function Editor(props: { documentId?: string | null; readOnly?: boolean; hideControls?: { back?: boolean; insert?: boolean; comments?: boolean; options?: boolean; presence?: boolean; share?: boolean } }): ReactElement {
	return (
		<EditorBody initialDocumentId={props.documentId ?? null} readOnly={props.readOnly} hideControls={props.hideControls} />
	);
}
