"use client";
import { useParams, useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { useAuthToken } from "@convex-dev/auth/react";
import EditorShell from "../../editor-shell";

export default function DocEditorPage(): ReactElement {
	const token = useAuthToken();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	if (!token) {
		router.replace("/signin");
	}
	return <EditorShell documentId={params?.id ?? null} />;
}
