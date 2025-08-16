"use client";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Providers } from "./providers";
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

function Sidebar(props: { documentId: string | null; activePageDocId: string | null; onSelect: (docId: string) => void; onCreatePage: () => void }): ReactElement {
	const pages = useQuery(
		props.documentId ? api.pages.list : (api.documents.list as any),
		props.documentId ? ({ documentId: props.documentId as any, parentPageId: undefined as any } as any) : ({} as any)
	) ?? [];
	const renamePage = useMutation(api.pages.rename);
	const removePage = useMutation(api.pages.remove);
	return (
		<div style={{ width: 260, borderRight: "1px solid #e5e7eb", padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
			<div style={{ display: "flex", gap: 8 }}>
				<button onClick={props.onCreatePage} disabled={!props.documentId}>+ Page</button>
			</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
				{(props.documentId ? pages : []).sort((a: any, b: any) => a.order - b.order).map((p: any) => (
					<div key={p._id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
						<button onClick={() => props.onSelect(p.docId)} style={{ flex: 1, textAlign: "left", background: props.activePageDocId === p.docId ? "#eef2ff" : undefined }}>
							{p.title || "Untitled"}
						</button>
						<button title="Rename" onClick={async () => {
							const title = prompt("Rename page", p.title) || p.title;
							await renamePage({ pageId: p._id, title });
						}}>✎</button>
						<button title="Delete" onClick={async () => {
							if (confirm("Delete page?")) await removePage({ pageId: p._id });
						}}>🗑</button>
					</div>
				))}
			</div>
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

function DebugTopBar(props: {
	pageDocId: string | null;
	isLoading: boolean;
	onNewPage: () => void;
}): ReactElement {
	return (
		<div style={{
			display: "flex",
			alignItems: "center",
			gap: 12,
			padding: "8px 12px",
			borderBottom: "1px solid #e5e7eb",
			position: "sticky",
			top: 0,
			background: "white",
			zIndex: 10,
		}}>
			<strong>Convex x BlockNote</strong>
			<span style={{ color: "#6b7280" }}>Page docId:</span>
			<code>{props.pageDocId ?? "—"}</code>
			<span style={{ color: "#6b7280" }}>Status:</span>
			<code>{props.isLoading ? "Loading" : "Ready"}</code>
			<button onClick={props.onNewPage} style={{ marginLeft: "auto" }}>New Page</button>
			<AuthControls />
		</div>
	);
}

function PresenceAvatars(props: { docId: string | null }): ReactElement {
	const presence = props.docId ? useQuery(api.presence.list, { docId: props.docId }) ?? [] : [];
	return (
		<div style={{ display: "flex", gap: 8, padding: "8px 12px" }}>
			{presence.map(p => (
				<div key={p.userId} title={p.name} style={{ width: 24, height: 24, borderRadius: 12, background: p.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
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
								if (prefix.trim() !== "/custom") return false;
								const startPos = sel.$from.start();
								const schema: any = (editor as any).pmSchema;
								const paragraph = schema.nodes.paragraph.create({ backgroundColor: "#FEF3C7", textColor: "#92400E" }, schema.text("Custom block"));
								let tr = state.tr.delete(startPos, sel.$from.pos);
								tr = tr.insert(startPos, paragraph);
								dispatch(tr);
								return true;
							},
						},
					})
				}),
			},
		},
	});

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
	return (
		<div style={{ padding: 16 }}>
			<BlockNoteView editor={(sync as any).editor} />
		</div>
	);
}

function EditorBody(): ReactElement {
	const [documentId, setDocumentId] = useState<string | null>(null);
	const [pageDocId, setPageDocId] = useState<string | null>(null);
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

	return (
		<div style={{ display: "flex", minHeight: "100vh" }}>
			<div style={{ width: 260, display: "flex", flexDirection: "column" }}>
				<DocumentPicker documentId={documentId} onSelect={(id) => { setDocumentId(id || null); setPageDocId(null); }} onCreate={onCreateDocument} />
				<Sidebar documentId={documentId} activePageDocId={pageDocId} onSelect={(id) => setPageDocId(id)} onCreatePage={onCreatePage} />
			</div>
			<div style={{ flex: 1 }}>
				<DebugTopBar pageDocId={pageDocId} isLoading={false} onNewPage={onCreatePage} />
				<PresenceAvatars docId={pageDocId} />
				{!pageDocId ? (
					<div style={{ padding: 16 }}>{documentId ? "Select or create a page" : "Select or create a document"}</div>
				) : (
					<DocumentEditor docId={pageDocId} />
				)}
			</div>
		</div>
	);
}

export default function Editor(): ReactElement {
	return (
		<Providers>
			<EditorBody />
		</Providers>
	);
}


