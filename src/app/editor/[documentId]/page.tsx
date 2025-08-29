"use client";
import type { ReactElement } from "react";
import { EditorShell } from "@/components/editor";
import { use } from "react";

export default function DocEditorPage({ params }: { params: Promise<{ documentId: string }> }): ReactElement {
	const { documentId } = use(params);
	return <EditorShell documentId={documentId} />;
}

