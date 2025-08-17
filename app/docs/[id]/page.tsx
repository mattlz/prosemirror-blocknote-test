"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useAuthToken } from "@convex-dev/auth/react";
import EditorShell from "../../editor-shell";

export default function DocEditorPage(): ReactElement {
	const token = useAuthToken();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const [ready, setReady] = useState(false);
	useEffect(() => {
		if (token === undefined) return; // still resolving
		if (!token) {
			router.replace("/signin");
			return;
		}
		// Persist last visited doc for refresh recovery
		if (params?.id) try { localStorage.setItem("lastDocId", String(params.id)); } catch {}
		setReady(true);
	}, [token, router, params]);
	if (!ready) return <div /> as any;
	return <EditorShell documentId={params?.id ?? null} />;
}
