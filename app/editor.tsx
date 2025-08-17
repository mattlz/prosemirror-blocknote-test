"use client";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteEditor } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { ArrowLeft, MessageCircle, Plus, PanelLeftClose, PanelLeftOpen, SmilePlus, ChevronRight, ChevronDown } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

function IconPicker({ value, onChange }: { value?: string | null; onChange: (val: string | null) => void }): ReactElement {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
		document.addEventListener("click", onDoc);
		return () => document.removeEventListener("click", onDoc);
	}, []);
	return (
		<div className="relative inline-block" ref={ref}>
			{value ? (
				<button className="text-5xl leading-none hover:opacity-70 transition-opacity" onClick={() => setOpen((v) => !v)}>
					{value}
				</button>
			) : (
				<button className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white text-lg text-neutral-400 hover:text-neutral-600" onClick={() => setOpen((v) => !v)}>
					<SmilePlus className="h-6 w-6" />
				</button>
			)}
			{open && (
				<div className="absolute z-20 mt-2">
					<EmojiPicker
						onEmojiClick={(emojiData) => {
							onChange(emojiData.emoji);
							setOpen(false);
						}}
						width={320}
						height={400}
					/>
					<button 
						className="mt-2 w-full rounded border px-2 py-1 text-xs bg-white hover:bg-neutral-50" 
						onClick={() => { onChange(null); setOpen(false); }}
					>
						Remove
					</button>
				</div>
			)}
		</div>
	);
}

function Sidebar(props: { documentId: string | null; activePageDocId: string | null; onSelect: (docId: string) => void; onCreatePage: () => void } & { onCollapse: () => void }): ReactElement {
	const pages = useQuery(
		props.documentId ? api.pages.list : (api.documents.list as any),
		props.documentId ? ({ documentId: props.documentId as any, parentPageId: undefined as any } as any) : ({} as any)
	);
	const renamePage = useMutation(api.pages.rename);
	const reorderPage = useMutation(api.pages.reorder);
	const removePage = useMutation(api.pages.remove);
	const createSubpage = useMutation(api.pages.createSubpage as any);
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const pagesArray: any[] = Array.isArray(pages) ? (pages as any[]) : [];
	const topLevelPages: any[] = useMemo(() => pagesArray.filter((p: any) => !p.parentPageId).sort((a: any, b: any) => a.order - b.order), [pagesArray]);
	const childrenByParent: Record<string, any[]> = useMemo(() => {
		const map: Record<string, any[]> = {};
		for (const p of pagesArray) {
			const parentId = (p as any).parentPageId;
			if (parentId) {
				const key = String(parentId);
				if (!map[key]) map[key] = [];
				map[key].push(p);
			}
		}
		for (const k of Object.keys(map)) map[k].sort((a, b) => a.order - b.order);
		return map;
	}, [pagesArray]);
	return (
		<div className="w-64 h-full bg-white border-r p-2 transition-transform duration-300 ease-in-out">
			<div className="flex items-center justify-between px-1 py-2">
				<span className="text-xs font-semibold text-neutral-500">Pages</span>
				<button aria-label="Collapse sidebar" className="text-neutral-600 hover:text-neutral-900 transition-colors" onClick={props.onCollapse}><PanelLeftClose className="h-5 w-5" /></button>
			</div>
			<div className="flex flex-col gap-1">
				{topLevelPages.map((p: any, idx: number) => {
					const children = childrenByParent[String(p._id)] ?? [];
					const hasChildren = children.length > 0;
					const isExpanded = expanded[String(p._id)] ?? false;
					const siblings = topLevelPages;
					return (
						<div key={p._id} className="relative">
							<div className={["group relative flex items-center gap-2 rounded-md px-2 py-1", props.activePageDocId === p.docId ? "bg-neutral-100" : "hover:bg-neutral-50"].join(" ")}>
								{hasChildren ? (
									<button
										aria-label={isExpanded ? "Collapse" : "Expand"}
										className="text-neutral-500 hover:text-neutral-900"
										onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [String(p._id)]: !isExpanded })); }}
									>
										{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
									</button>
								) : <span className="w-4" />}
								<button onClick={() => props.onSelect(p.docId)} className="flex flex-1 items-center gap-2 text-left text-sm">
									<span className="text-sm">{p.icon ?? ""}</span>
									<span className="truncate">{p.title || "Untitled"}</span>
								</button>
								<button aria-label="Page menu" className="invisible h-6 w-6 rounded-md border text-xs group-hover:visible" onClick={() => setOpenMenuId(openMenuId === String(p._id) ? null : String(p._id))}>⋯</button>
								{openMenuId === String(p._id) ? (
									<div className="absolute right-2 top-7 z-20 w-44 rounded-md border bg-white p-1 shadow-md">
										<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
											const title = prompt("Rename page", p.title) || p.title;
											await renamePage({ pageId: p._id, title });
											setOpenMenuId(null);
										}}>Rename</button>
										{idx > 0 ? (
											<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
												await reorderPage({ pageId: p._id, beforePageId: siblings[idx - 1]._id });
												setOpenMenuId(null);
											}}>Move Up</button>
										) : null}
										{idx < siblings.length - 1 ? (
											<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
												const targetBefore = idx + 2 < siblings.length ? siblings[idx + 2]._id : undefined;
												if (targetBefore) {
													await reorderPage({ pageId: p._id, beforePageId: targetBefore });
												} else {
													await reorderPage({ pageId: p._id } as any); // move to end
												}
												setOpenMenuId(null);
											}}>Move Down</button>
										) : null}
										<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
											const title = prompt("New subpage title", "Untitled page") || "Untitled page";
											const { docId } = await createSubpage({ documentId: p.documentId, parentPageId: p._id, title } as any);
											setExpanded((prev) => ({ ...prev, [String(p._id)]: true }));
											props.onSelect(docId);
											setOpenMenuId(null);
										}}>Add subpage</button>
										<button className="block w-full rounded px-2 py-1 text-left text-sm text-red-600 hover:bg-red-50" onClick={async () => {
											if (confirm("Delete page?")) {
												await removePage({ pageId: p._id });
												if (props.activePageDocId === p.docId) props.onSelect("");
											}
											setOpenMenuId(null);
										}}>Delete Page</button>
									</div>
								) : null}
							</div>

							{hasChildren && isExpanded ? (
								<div className="mt-1">
									{children.map((c: any, cIdx: number) => {
										const cSiblings = children;
										return (
											<div key={c._id} className={["group relative ml-4 flex items-center gap-2 rounded-md px-2 py-1", props.activePageDocId === c.docId ? "bg-neutral-100" : "hover:bg-neutral-50"].join(" ")}>
												<span className="w-4" />
												<button onClick={() => props.onSelect(c.docId)} className="flex flex-1 items-center gap-2 text-left text-sm">
													<span className="text-sm">{c.icon ?? ""}</span>
													<span className="truncate">{c.title || "Untitled"}</span>
												</button>
												<button aria-label="Page menu" className="invisible h-6 w-6 rounded-md border text-xs group-hover:visible" onClick={() => setOpenMenuId(openMenuId === String(c._id) ? null : String(c._id))}>⋯</button>
												{openMenuId === String(c._id) ? (
													<div className="absolute right-2 top-7 z-20 w-40 rounded-md border bg-white p-1 shadow-md">
														<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
															const title = prompt("Rename page", c.title) || c.title;
															await renamePage({ pageId: c._id, title });
															setOpenMenuId(null);
														}}>Rename</button>
														{cIdx > 0 ? (
															<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
																await reorderPage({ pageId: c._id, beforePageId: cSiblings[cIdx - 1]._id });
																setOpenMenuId(null);
															}}>Move Up</button>
														) : null}
														{cIdx < cSiblings.length - 1 ? (
															<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
																const targetBefore = cIdx + 2 < cSiblings.length ? cSiblings[cIdx + 2]._id : undefined;
																if (targetBefore) {
																	await reorderPage({ pageId: c._id, beforePageId: targetBefore });
																} else {
																	await reorderPage({ pageId: c._id } as any); // move to end
																}
																setOpenMenuId(null);
															}}>Move Down</button>
														) : null}
														<button className="block w-full rounded px-2 py-1 text-left text-sm text-red-600 hover:bg-red-50" onClick={async () => {
															if (confirm("Delete page?")) {
																await removePage({ pageId: c._id });
																if (props.activePageDocId === c.docId) props.onSelect("");
															}
															setOpenMenuId(null);
														}}>Delete Page</button>
													</div>
												) : null}
											</div>
										);
									})}
								</div>
							) : null}
						</div>
					);
				})}
			</div>
			<button className="mt-2 flex w-full items-center gap-1 px-2 py-1 text-left text-sm text-neutral-600 hover:text-neutral-900" onClick={props.onCreatePage} disabled={!props.documentId}><Plus className="h-4 w-4" /> New page</button>
		</div>
	);
}

function AuthControls(): ReactElement {
	const token = useAuthToken();
	const { signIn, signOut } = useAuthActions();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [mode, setMode] = useState<"signUp" | "signIn">("signIn");
	if (token) {
		return (
			<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<span>Signed in</span>
				<button onClick={() => signOut()}>Sign out</button>
			</div>
		);
	}
	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				await signIn("password", { flow: mode, email, password });
			}}
			style={{ display: "flex", gap: 8, alignItems: "center" }}
		>
			<select value={mode} onChange={(e) => setMode(e.target.value as any)}>
				<option value="signIn">Sign in</option>
				<option value="signUp">Sign up</option>
			</select>
			<input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
			<input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
			<button type="submit">Go</button>
		</form>
	);
}

function DocumentPicker(props: { documentId: string | null; onSelect: (id: string) => void; onCreate: () => void }): ReactElement {
	const docs = useQuery(api.documents.list, {}) ?? [];
	return (
		<div style={{ display: "flex", gap: 8, padding: 8, borderBottom: "1px solid #e5e7eb" }}>
			<select value={props.documentId ?? ""} onChange={(e) => props.onSelect(e.target.value)}>
				<option value="">Select a document…</option>
				{docs.map((d: any) => (
					<option key={d._id} value={d._id}>{d.title}</option>
				))}
			</select>
			<button onClick={props.onCreate}>+ Document</button>
		</div>
	);
}

function PresenceAvatars(props: { docId: string | null; className?: string }): ReactElement {
	if (!props.docId) return <div style={{ height: 0 }} /> as any;
	return <PresenceAvatarsInner docId={props.docId} className={props.className} /> as any;
}

function PresenceAvatarsInner({ docId, className }: { docId: string; className?: string }): ReactElement {
	const presence = useQuery(api.presence.list, { docId }) ?? [];
	return (
		<div className={["flex items-center -space-x-2", className].filter(Boolean).join(" ")}> 
			{presence.map((p, idx) => (
				<div
					key={p.userId ?? idx}
					title={p.name}
					className="relative inline-flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-white text-[11px] font-medium text-white"
					style={{ background: (p as any).color }}
				>
					{p.name.slice(0, 1).toUpperCase()}
				</div>
			))}
		</div>
	);
}

function CommentsSidebar(): ReactElement {
	return (
		<aside className="w-80 shrink-0 border-l bg-white p-4">
			<div className="text-base font-semibold">Comments <span className="text-neutral-400">»</span></div>
			<div className="mt-4 text-sm text-neutral-500">No comments yet.</div>
		</aside>
	);
}

const remoteCursorKey = new PluginKey("remoteCursors");

function remoteCursorPlugin(getPresence: () => Array<{ userId: string; name: string; color: string; cursor: string }>) {
	return new Plugin({
		key: remoteCursorKey,
		state: {
			init: () => DecorationSet.empty,
			apply(tr, set) {
				const mapped = set.map(tr.mapping, tr.doc);
				return mapped;
			},
		},
		props: {
			decorations(state) {
				const presence = getPresence();
				const decos: Decoration[] = [];
				for (const p of presence) {
					const pos = Number(p.cursor || 0);
					const color = p.color || "#3b82f6";
					const cursorEl = document.createElement("span");
					cursorEl.style.borderLeft = `2px solid ${color}`;
					cursorEl.style.marginLeft = "-1px";
					cursorEl.style.height = "1em";
					cursorEl.style.display = "inline-block";
					cursorEl.style.position = "relative";
					cursorEl.style.verticalAlign = "text-bottom";
					const label = document.createElement("div");
					label.textContent = p.name;
					label.style.position = "absolute";
					label.style.top = "-1.2em";
					label.style.left = "0";
					label.style.background = color;
					label.style.color = "white";
					label.style.padding = "0 4px";
					label.style.borderRadius = "3px";
					label.style.fontSize = "10px";
					cursorEl.appendChild(label);
					decos.push(Decoration.widget(pos, cursorEl, { key: `cursor-${p.userId}` }));
				}
				return DecorationSet.create(state.doc, decos);
			},
		},
	});
}

function DocumentEditor({ docId }: { docId: string }): ReactElement {
	const presence = useQuery(api.presence.list, { docId }) ?? [];
	const sync = useBlockNoteSync<BlockNoteEditor>(api.example, docId, {
		snapshotDebounceMs: 1000,
		editorOptions: {
			_extensions: {
				remoteCursors: () => ({ plugin: remoteCursorPlugin(() => presence as any) }),
			},
		},
	});

	const token = useAuthToken();
	const heartbeat = useMutation(api.presence.heartbeat);
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

	if ((sync as any)?.isLoading) return <p style={{ padding: 16 }}>Loading…</p> as any;
	if (!(sync as any)?.editor) return <div style={{ padding: 16 }}>Editor not ready</div> as any;
	const editorInst: any = (sync as any).editor;
	
	return (
		<div className="mt-4">
			<BlockNoteView editor={editorInst} />
		</div>
	);
}

function EditorBody(props: { initialDocumentId?: string | null }): ReactElement {
	const [documentId, setDocumentId] = useState<string | null>(props.initialDocumentId ?? null);
	const [pageDocId, setPageDocId] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
	const [showOpenButton, setShowOpenButton] = useState<boolean>(false);
	const [commentsOpen, setCommentsOpen] = useState<boolean>(false);
	const createDocument = useMutation(api.documents.create);
	const createPage = useMutation(api.pages.create);
	const setIconMutation = useMutation(api.pages.setIcon);

	const onCreateDocument = async (): Promise<void> => {
		const title = prompt("New document title", "Untitled Document") || "Untitled Document";
		const id = await createDocument({ title });
		setDocumentId(id as any);
		try {
			const { docId } = await createPage({ documentId: id as any, title: "Untitled" });
			setPageDocId(docId);
		} catch {
			// If page creation fails, keep the document selected and let user create manually
			setPageDocId(null);
		}
	};

	const onCreatePage = async (): Promise<void> => {
		if (!documentId) return;
		const title = prompt("New page title", "Untitled") || "Untitled";
		const { docId } = await createPage({ documentId: documentId as any, title });
		setPageDocId(docId);
	};

	// Load lists to compute titles and preselect first page
	const pages = useQuery(documentId ? api.pages.list : (api.documents.list as any), documentId ? ({ documentId: documentId as any } as any) : ({} as any)) ?? [];
	const documents = useQuery(api.documents.list, {}) ?? [];
	const documentTitle = useMemo(() => (documents as any[]).find((d) => d._id === documentId)?.title ?? "All docs", [documents, documentId]);
	const currentPageTitle = useMemo(() => (pages as any[]).find((p) => p.docId === pageDocId)?.title ?? "Untitled", [pages, pageDocId]);
	const currentPage = useMemo(() => (pages as any[]).find((p) => p.docId === pageDocId), [pages, pageDocId]);

	// Track last documentId to prevent repeated auto-creation across opens
	const lastDocIdRef = useRef<string | null>(null);

	// Preselect first page only after pages have loaded
	useEffect(() => {
		if (!documentId) return;
		if (!Array.isArray(pages)) return; // still loading
		if (pageDocId) return;
		const topLevel = (pages as any[]).filter((p) => !(p as any).parentPageId);
		const first = topLevel.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
		if (first?.docId) setPageDocId(first.docId);
	}, [documentId, pageDocId, pages]);

	// Handle sidebar open/close timing
	useEffect(() => {
		if (!sidebarOpen) {
			// Show open button after slide-out animation completes (300ms)
			const timer = setTimeout(() => setShowOpenButton(true), 300);
			return () => clearTimeout(timer);
		} else {
			// Hide open button immediately when sidebar opens
			setShowOpenButton(false);
		}
	}, [sidebarOpen]);

	// Note: We intentionally do NOT auto-create pages on open.
	// First page creation happens only in onCreateDocument for a smoother onboarding without surprises.

	return (
		<div className="min-h-screen w-full overflow-hidden">
			{/* Top bar */}
			<div className="sticky top-0 z-10 flex w-full items-center gap-3 border-b bg-white px-4 py-2">
				<button className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-sm" onClick={() => { window.location.href = "/docs"; }}><ArrowLeft className="h-4 w-4" /> All docs</button>
				<div className="text-lg font-semibold">{documentTitle}</div>
				<div className="ml-auto flex items-center gap-2">
					<button aria-label="Comments" className={["inline-flex h-8 w-8 items-center justify-center rounded-md border", commentsOpen ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={() => setCommentsOpen((v) => !v)}><MessageCircle className="h-4 w-4" /></button>
					<PresenceAvatars docId={pageDocId} />
				</div>
			</div>

			{/* Body: sidebar + editor + comments */}
			<div className="flex h-[calc(100vh-theme(spacing.16))] relative overflow-hidden">
				<div className={`transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
					<Sidebar documentId={documentId} activePageDocId={pageDocId} onSelect={(id) => setPageDocId(id)} onCreatePage={onCreatePage} onCollapse={() => setSidebarOpen(false)} />
				</div>
				{showOpenButton && (
					<button 
						aria-label="Open sidebar" 
						className="absolute left-4 top-2 z-20 text-neutral-600 hover:text-neutral-900 transition-all duration-300 ease-in-out animate-in fade-in"
						onClick={() => setSidebarOpen(true)}
					>
						<PanelLeftOpen className="h-5 w-5" />
					</button>
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
								<DocumentEditor docId={pageDocId} />
							</div>
						</div>
					)}
				</div>
				{commentsOpen ? <CommentsSidebar /> : null}
			</div>
		</div>
	);
}

export default function Editor(props: { documentId?: string | null }): ReactElement {
	return (
		<EditorBody initialDocumentId={props.documentId ?? null} />
	);
}


