"use client";
import { useEffect, useMemo, useState, type ReactElement } from "react";
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
import type { DefaultSuggestionItem } from "@blocknote/core/types/src/extensions/SuggestionMenu/DefaultSuggestionItem";
import { insertOrUpdateBlock } from "@blocknote/core/types/src/extensions/SuggestionMenu/getDefaultSlashMenuItems";
import { bannerSchema } from "./blocks/banner";
import { SuggestionMenuController } from "@blocknote/react";

function Sidebar(props: { documentId: string | null; activePageDocId: string | null; onSelect: (docId: string) => void; onCreatePage: () => void } & { onCollapse: () => void }): ReactElement {
	const pages = useQuery(
		props.documentId ? api.pages.list : (api.documents.list as any),
		props.documentId ? ({ documentId: props.documentId as any, parentPageId: undefined as any } as any) : ({} as any)
	) ?? [];
	useMutation(api.pages.rename);
	useMutation(api.pages.remove);
	return (
		<div className="w-64 bg-white p-2">
			<div className="flex items-center justify-between px-1 py-2">
				<span className="text-xs font-semibold text-neutral-500">Pages</span>
				<button aria-label="Collapse sidebar" className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs" onClick={props.onCollapse}>≡</button>
			</div>
			<div className="flex flex-col gap-1">
				{(props.documentId ? pages : []).sort((a: any, b: any) => a.order - b.order).map((p: any) => (
					<button key={p._id} onClick={() => props.onSelect(p.docId)} className={["flex items-center justify-between rounded-md px-2 py-1 text-left text-sm hover:bg-neutral-50", props.activePageDocId === p.docId ? "bg-neutral-100" : ""].join(" ")}>
						<span className="truncate">{p.title || "Untitled"}</span>
					</button>
				))}
			</div>
			<button className="mt-2 w-full px-2 py-1 text-left text-sm text-neutral-600 hover:text-neutral-900" onClick={props.onCreatePage} disabled={!props.documentId}>+ New page</button>
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
			schema: (bannerSchema as any),
			_extensions: {
				remoteCursors: () => ({ plugin: remoteCursorPlugin(() => presence as any) }),
				customSlash: (editor: BlockNoteEditor) => ({
					plugin: new Plugin({
						props: {
							handleKeyDown(view, event) {
								if (event.key !== " " && event.key !== "Enter") return false;
								const { state, dispatch } = view;
								const sel: any = state.selection;
								if (!sel || !sel.$from || !sel.$from.parent || !sel.$from.parent.isTextblock) return false;
								const prefix = sel.$from.parent.textBetween(0, sel.$from.parentOffset, undefined, "\uFFFC");
								if (prefix.trim() !== "/banner") return false;
								const startPos = sel.$from.start();
								const schema: any = (editor as any).pmSchema;
								const node = schema.nodes.banner?.create({}, schema.text("Custom block"));
								if (!node) return false;
								let tr = state.tr.delete(startPos, sel.$from.pos);
								tr = tr.insert(startPos, node);
								dispatch(tr);
								return true;
							},
						},
					})
				}),
			},
		},
	});

	// Add a visible slash menu item for the banner block
	useEffect(() => {
		const editor = (sync as any)?.editor as any;
		if (!editor?.suggestionMenus) return;
		const items = editor.suggestionMenus.items || [];
		if (items.some((i: any) => i?.title === "Custom block")) return;
		items.push({
			title: "Custom block",
			aliases: ["custom", "banner"],
			subtext: "Insert a banner",
			onItemClick: () => {
				editor.insertBlocks([{ type: "banner", content: [{ type: "text", text: "Custom block" }] }]);
			},
		});
	}, [(sync as any)?.editor]);

	// remove private suggestion menu edits

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
	const getItems = async (query: string) => {
		const defaults = (await import("@blocknote/react")).getDefaultReactSlashMenuItems(editorInst);
		const custom = [{
			title: "Custom block",
			aliases: ["custom", "banner"],
			subtext: "Insert a banner",
			onItemClick: (editor: any) => {
				editor.insertBlocks([{ type: "banner", content: "Custom block" }]);
				editor.suggestionMenus?.clearQuery?.();
				editor.suggestionMenus?.closeMenu?.();
			},
		}];
		const all = [...defaults, ...custom];
		const { filterSuggestionItems } = await import("@blocknote/core");
		return filterSuggestionItems(all as any, query) as any;
	};
	return (
		<div className="mt-4">
			<BlockNoteView editor={editorInst}>
				<SuggestionMenuController triggerCharacter="/" getItems={getItems} />
			</BlockNoteView>
		</div>
	);
}

function EditorBody(props: { initialDocumentId?: string | null }): ReactElement {
	const [documentId, setDocumentId] = useState<string | null>(props.initialDocumentId ?? null);
	const [pageDocId, setPageDocId] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
	const createDocument = useMutation(api.documents.create);
	const createPage = useMutation(api.pages.create);

	const onCreateDocument = async (): Promise<void> => {
		const title = prompt("New document title", "Untitled Document") || "Untitled Document";
		const id = await createDocument({ title });
		setDocumentId(id as any);
		setPageDocId(null);
	};

	const onCreatePage = async (): Promise<void> => {
		if (!documentId) return;
		const title = prompt("New page title", "Untitled") || "Untitled";
		const { docId } = await createPage({ documentId: documentId as any, title });
		setPageDocId(docId);
	};

	// Load lists to compute titles and preselect first page
	const pages = useQuery(documentId ? api.pages.list : (api.documents.list as any), documentId ? ({ documentId: documentId as any, parentPageId: undefined as any } as any) : ({} as any)) ?? [];
	const documents = useQuery(api.documents.list, {}) ?? [];
	const documentTitle = useMemo(() => (documents as any[]).find((d) => d._id === documentId)?.title ?? "All docs", [documents, documentId]);
	const currentPageTitle = useMemo(() => (pages as any[]).find((p) => p.docId === pageDocId)?.title ?? "Untitled", [pages, pageDocId]);

	// Preselect first page if none selected
	useEffect(() => {
		if (!documentId) return;
		if (pageDocId) return;
		const first = (pages as any[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
		if (first?.docId) setPageDocId(first.docId);
	}, [documentId, pageDocId, pages]);

	return (
		<div className="min-h-screen w-full overflow-hidden">
			{/* Top bar */}
			<div className="sticky top-0 z-10 flex w-full items-center gap-3 border-b bg-white px-4 py-2">
				<button className="inline-flex h-8 items-center rounded-md border px-2 text-sm" onClick={() => { window.location.href = "/docs"; }}>← All docs</button>
				<button className="inline-flex h-8 items-center rounded-md border px-2 text-sm" onClick={() => setSidebarOpen((v) => !v)}>{sidebarOpen ? "Hide sidebar" : "Show sidebar"}</button>
				<div className="text-lg font-semibold">{documentTitle}</div>
				<div className="ml-auto">
					<PresenceAvatars docId={pageDocId} />
				</div>
			</div>

			{/* Body: sidebar + editor */}
			<div className="flex">
				{sidebarOpen ? (
					<Sidebar documentId={documentId} activePageDocId={pageDocId} onSelect={(id) => setPageDocId(id)} onCreatePage={onCreatePage} onCollapse={() => setSidebarOpen(false)} />
				) : (
					<div className="w-3 shrink-0" />
				)}
				<div className="flex-1">
					{!pageDocId ? (
						<div className="p-6 text-neutral-600">{documentId ? "Select or create a page" : "No document selected"}</div>
					) : (
						<div className="p-6">
							<div className="mx-auto w-full max-w-[1200px]">
								<h1 className="mb-6 mt-6 text-5xl font-extrabold tracking-tight">{currentPageTitle || "Untitled"}</h1>
								<DocumentEditor docId={pageDocId} />
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function Editor(props: { documentId?: string | null }): ReactElement {
	return (
		<EditorBody initialDocumentId={props.documentId ?? null} />
	);
}


