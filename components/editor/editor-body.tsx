"use client";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import CommentsSidebar from "@/app/comments/comments-sidebar";
import { BlockNoteEditor } from "@/components/editor";
import { PageSidebar, IconPicker } from "@/components/sidebar";
import { TopBar, SidebarOpenButton } from "@/components/layout";
import { PageOptionsModal } from "@/components/modals/page-options-modal";

export function EditorBody(props: { initialDocumentId?: string | null; documentId?: string | null }): ReactElement {
	const [documentId, setDocumentId] = useState<string | null>(props.initialDocumentId ?? props.documentId ?? null);
	const [pageDocId, setPageDocId] = useState<string | null>(null);
	
	const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
	const [showOpenButton, setShowOpenButton] = useState<boolean>(false);
	const [commentsOpen, setCommentsOpen] = useState<boolean>(false);
	const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
	const [showRemoteCursors, setShowRemoteCursors] = useState<boolean>(true);

	const editorRef = useRef<any>(null);
	const createDocument = useMutation(api.documents.create);
	const createPage = useMutation(api.pages.create);
	const setIconMutation = useMutation(api.pages.setIcon);
	const createThreadMutation = useMutation(api.comments.createThread);

	const onCreateDocument = async (): Promise<void> => {
		const title = prompt("New document title", "Untitled Document") || "Untitled Document";
		const id = await createDocument({ title });
		setDocumentId(id as any);
		try {
			const { docId } = await createPage({ documentId: id as any, title: "Untitled" });
			setPageDocId(docId);
		} catch {
			setPageDocId(null);
		}
	};

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
	const currentPage = useMemo(() => (pages as any[]).find((p) => p.docId === pageDocId), [pages, pageDocId]);

	const lastDocIdRef = useRef<string | null>(null);

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

	return (
		<div className="min-h-screen w-full overflow-hidden">
			<TopBar
				documentTitle={documentTitle}
				docId={pageDocId}
				onToggleComments={() => setCommentsOpen((v) => !v)}
				commentsOpen={commentsOpen}
				optionsOpen={optionsOpen}
				onToggleOptions={() => setOptionsOpen((v) => !v)}
			/>

			<div className="flex h-[calc(100vh-theme(spacing.16))] relative overflow-hidden">
				<div className={`transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
					<PageSidebar documentId={documentId} activePageDocId={pageDocId} onSelect={(id) => setPageDocId(id)} onCreatePage={onCreatePage} onCollapse={() => setSidebarOpen(false)} />
				</div>
				{showOpenButton && (
					<SidebarOpenButton onOpen={() => setSidebarOpen(true)} />
				)}
				<div className="flex-1">
					{!pageDocId ? (
						<div className="p-6 text-neutral-600">{documentId ? "Select or create a page" : "No document selected"}</div>
					) : (
						<div className="p-6">
							<div className="mx-auto w-full max-w-[1000px]">
								<div className="mt-4 mb-4 flex items-center gap-3">
									<IconPicker value={(pages as any[]).find((p) => p.docId === pageDocId)?.icon ?? null} onChange={(val) => {
										const page = (pages as any[]).find((p) => p.docId === pageDocId);
										if (!page) return;
										setIconMutation({ pageId: page._id, icon: val ?? undefined }).catch(() => {});
									}} />
									<h1 className="text-5xl font-extrabold tracking-tight">{currentPageTitle || "Untitled"}</h1>
								</div>
								<BlockNoteEditor docId={pageDocId} showRemoteCursors={showRemoteCursors} onEditorReady={(e: any) => { editorRef.current = e; }} />
							</div>
						</div>
					)}
				</div>
				{commentsOpen ? (
					<CommentsSidebar 
						docId={pageDocId ?? ""}
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
					/>
				) : null}
			</div>
			<PageOptionsModal
				isOpen={optionsOpen}
				onClose={() => setOptionsOpen(false)}
				showRemoteCursors={showRemoteCursors}
				onToggleRemoteCursors={setShowRemoteCursors}
			/>
		</div>
	);
}

export default function Editor(props: { documentId?: string | null }): ReactElement {
	return (
		<EditorBody initialDocumentId={props.documentId ?? null} />
	);
}


