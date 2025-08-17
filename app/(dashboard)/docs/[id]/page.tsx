"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { ReactElement } from "react";
import EditorShell from "@/app/editor-shell";

export default function DocEditorPage(): ReactElement {
	const params = useParams<{ id: string }>();
	const [ready, setReady] = useState(false);
	useEffect(() => {
		// Persist last visited doc for refresh recovery
		if (params?.id) try { localStorage.setItem("lastDocId", String(params.id)); } catch {}
		setReady(true);
	}, [params]);
	if (!ready) return <div /> as any;
	return <EditorShell documentId={params?.id ?? null} />;
}

