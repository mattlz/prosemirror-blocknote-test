"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useAuthToken } from "@convex-dev/auth/react";
import EditorShell from "../../editor-shell";

export default function DocEditorPage(): ReactElement {
	const token = useAuthToken();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	useEffect(() => {
		// Wait for auth to resolve; only redirect when we definitively know there is no token
		if (token === undefined) return;
		if (!token) router.replace("/signin");
	}, [token, router]);
	return <EditorShell documentId={params?.id ?? null} />;
}
