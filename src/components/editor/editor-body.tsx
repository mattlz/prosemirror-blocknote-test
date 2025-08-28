"use client";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import CommentsSidebar from "@/app/comments/comments-sidebar";
import { BlockNoteEditor } from "@/components/editor";
import { PageSidebar, IconPicker } from "@/components/sidebar";
import { TopBar, SidebarOpenButton } from "@/components/layout";
import { PageOptionsModal } from "@/components/modals/page-options-modal";

export function EditorBody(props: { initialDocumentId?: string | null; documentId?: string | null; readOnly?: boolean }): ReactElement {
	const [documentId] = useState<string | null>(props.initialDocumentId ?? props.documentId ?? null);
	const [pageDocId, setPageDocId] = useState<string | null>(null);
	
	const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
	const [showOpenButton, setShowOpenButton] = useState<boolean>(false);
	const [commentsOpen, setCommentsOpen] = useState<boolean>(false);
	const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
	// Remote cursors are always enabled; we only toggle labels
	const [showCursorLabels, setShowCursorLabels] = useState<boolean>(true);
	const [pageWidth, setPageWidth] = useState<"default" | "full">("default");
	const [theme, setTheme] = useState<"light" | "dark">("light");

	const [editorInstance, setEditorInstance] = useState<any>(null);
	const editorRef = useRef<any>(null);
	const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
	const [saveErrorAt, setSaveErrorAt] = useState<number | null>(null);
	const createPage = useMutation(api.pages.create);
	const setIconMutation = useMutation(api.pages.setIcon);
	const createThreadMutation = useMutation(api.comments.createThread);

	const onCreatePage = async (): Promise<void> => {
		if (!documentId) return;
		const title = prompt("New page title", "Untitled") || "Untitled";
		const { docId } = await createPage({ documentId: documentId as any, title });
		setPageDocId(docId);
	};

	const pages = useQuery(documentId ? api.pages.list : (api.documents.list as any), documentId ? ({ documentId: documentId as any } as any) : ({} as any)) ?? [];
	const documents = useQuery(api.documents.list, {}) ?? [];
	
	const documentTitle = useMemo(() => (documents as any[]).find((d) => d._id === documentId)?.title ?? "All docs", [documents, documentId]);
	const currentPageTitle = useMemo(() => (pages as any[]).find((p) => p.docId === pageDocId)?.title ?? "Untitled", [pages, pageDocId]);

	useEffect(() => {
		if (!documentId) return;
		if (!Array.isArray(pages)) return;
		if (pageDocId) return;
		const topLevel = (pages as any[]).filter((p) => !(p as any).parentPageId);
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

	// Listen for global save events from the editor (manual + autosave)
	useEffect(() => {
		const onSaved = (e: any) => {
			if (!pageDocId || e?.detail?.docId !== pageDocId) return;
			setLastSavedAt(Date.now());
			setSaveErrorAt(null);
		};
		const onSaveError = (e: any) => {
			if (!pageDocId || e?.detail?.docId !== pageDocId) return;
			setSaveErrorAt(Date.now());
		};
		if (typeof window !== "undefined") {
			window.addEventListener("doc-saved", onSaved as any);
			window.addEventListener("doc-save-error", onSaveError as any);
		}
		return () => {
			if (typeof window !== "undefined") {
				window.removeEventListener("doc-saved", onSaved as any);
				window.removeEventListener("doc-save-error", onSaveError as any);
			}
		};
	}, [pageDocId]);

	// Periodic tick so relative time updates even without new saves
	useEffect(() => {
		const interval = setInterval(() => {
			// trigger a render by toggling a state that we don't otherwise use
			setLastSavedAt((v) => (v !== null ? v : v));
		}, 10000);
		return () => clearInterval(interval);
	}, []);

	function formatRelative(ts: number | null): string {
		if (!ts) return "";
		const seconds = Math.floor((Date.now() - ts) / 1000);
		if (seconds < 60) return "Just now";
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}

	return (
		<div className="h-screen w-full overflow-hidden flex flex-col">
			<TopBar
				documentTitle={documentTitle}
				docId={pageDocId}
				documentId={documentId}
				readOnly={!!props.readOnly}
				onToggleComments={() => setCommentsOpen((v) => !v)}
				commentsOpen={commentsOpen}
				optionsOpen={optionsOpen}
				onToggleOptions={() => setOptionsOpen((v) => !v)}
				editor={props.readOnly ? null : editorInstance}
				theme={theme}
			/>

			<div className="flex flex-1 relative overflow-hidden min-h-0">
				<div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden`}>
					<div className={`h-full transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
						<div className="h-full relative">
							<PageSidebar documentId={documentId} activePageDocId={pageDocId} onSelect={(id) => setPageDocId(id)} onCreatePage={onCreatePage} onCollapse={() => setSidebarOpen(false)} theme={theme} />
							<div className="absolute left-2 right-2 bottom-2 text-[11px] text-neutral-500">
								{saveErrorAt ? (
									<div className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-red-700">Save failed. Retrying…</div>
								) : (
									<div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1">
										{lastSavedAt ? `Last saved ${formatRelative(lastSavedAt)}` : "Waiting for first save…"}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
				{showOpenButton && (
					<SidebarOpenButton onOpen={() => setSidebarOpen(true)} />
				)}
				<div className="flex-1 min-h-0">
					{!pageDocId ? (
						<div className="h-full overflow-auto p-6 text-neutral-600">{documentId ? "Select or create a page" : "No document selected"}</div>
					) : (
						<div className={`h-full overflow-auto p-6 ${theme === "dark" ? "bg-neutral-900 text-neutral-100" : "bg-white text-neutral-900"}`}>
							<div className={pageWidth === "full" ? "w-full max-w-none" : "mx-auto w-full max-w-[1000px]"}>
								<div className="mt-4 mb-4 flex items-center gap-3">
									<IconPicker theme={theme} value={(pages as any[]).find((p) => p.docId === pageDocId)?.icon ?? null} onChange={(val) => {
										const page = (pages as any[]).find((p) => p.docId === pageDocId);
										if (!page) return;
										setIconMutation({ pageId: page._id, icon: val ?? undefined }).catch(() => {});
									}} />
									<h1 className="text-5xl font-extrabold tracking-tight">{currentPageTitle || "Untitled"}</h1>
								</div>
								<BlockNoteEditor docId={pageDocId} showCursorLabels={showCursorLabels} editable={!props.readOnly} theme={theme} onEditorReady={(e: any) => { 
									editorRef.current = e; 
									setEditorInstance(e);
								}} />
							</div>
						</div>
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
								const getBlocks = (editorRef.current as any)?.getSelectedBlocks ?? (editorRef.current as any)?.blocksForSelection;
								const blocks = getBlocks?.call(editorRef.current) ?? [];
								if (Array.isArray(blocks) && blocks.length > 0 && (blocks[0] as any)?.id) {
									selectedId = (blocks[0] as any).id;
								} else {
									const allBlocks = (editorRef.current as any)?.document ?? [];
									if (Array.isArray(allBlocks) && allBlocks.length > 0 && (allBlocks[0] as any)?.id) {
										selectedId = (allBlocks[0] as any).id;
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

export default function Editor(props: { documentId?: string | null; readOnly?: boolean }): ReactElement {
	return (
		<EditorBody initialDocumentId={props.documentId ?? null} readOnly={props.readOnly} />
	);
}


