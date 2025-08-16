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

function DebugTopBar(props: {
	docId: string;
	isLoading: boolean;
	onNewId: () => void;
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
			<span style={{ color: "#6b7280" }}>Doc ID:</span>
			<code>{props.docId}</code>
			<span style={{ color: "#6b7280" }}>Status:</span>
			<code>{props.isLoading ? "Loading" : "Ready"}</code>
			<button onClick={props.onNewId} style={{ marginLeft: "auto" }}>New Doc</button>
			<AuthControls />
		</div>
	);
}

function PresenceAvatars(props: { docId: string }): ReactElement {
	const presence = useQuery(api.presence.list, { docId: props.docId }) ?? [];
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

function EditorBody(): ReactElement {
	const [docId, setDocId] = useState<string>(() => {
		const fromHash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
		return fromHash || "demo-doc";
	});

	const presence = useQuery(api.presence.list, { docId }) ?? [];

	const sync = useBlockNoteSync<BlockNoteEditor>(api.example, docId, {
		snapshotDebounceMs: 1000,
		editorOptions: {
			_extensions: {
				remoteCursors: (editor: BlockNoteEditor) => ({
					plugin: remoteCursorPlugin(() => presence as any),
				}),
			},
		},
	});

	const token = useAuthToken();
	const heartbeat = useMutation(api.presence.heartbeat);

	// send presence heartbeat when signed in
	useEffect(() => {
		if (!token) return;
		let active = true;
		const color = `hsl(${Math.floor(Math.random() * 360)} 70% 45%)`;
		const name = `User`;
		const interval = setInterval(() => {
			if (!active) return;
			// Get current selection head position
			const pos = (sync as any)?.editor?.prosemirrorState?.selection?.head ?? 0;
			heartbeat({ docId, cursor: String(pos), name, color }).catch(() => {});
		}, 1000);
		return () => {
			active = false;
			clearInterval(interval);
		};
	}, [docId, heartbeat, token, (sync as any)?.editor]);

	const onNewId = (): void => {
		const newId = Math.random().toString(36).slice(2);
		setDocId(newId);
		if (typeof window !== "undefined") {
			window.location.hash = newId;
		}
	};

	return (
		<div style={{ maxWidth: 900, margin: "0 auto" }}>
			<DebugTopBar docId={docId} isLoading={sync.isLoading} onNewId={onNewId} />
			<PresenceAvatars docId={docId} />
			{sync.isLoading ? (
				<p style={{ padding: 16 }}>Loading…</p>
			) : sync.editor ? (
				<div style={{ padding: 16 }}>
					<BlockNoteView editor={sync.editor} />
				</div>
			) : (
				<div style={{ padding: 16 }}>
					<button onClick={() => sync.create?.({ type: "doc", content: [] })}>Create document</button>
				</div>
			)}
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


