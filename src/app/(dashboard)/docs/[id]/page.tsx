"use client";
import type { ReactElement } from "react";
import { EditorShell } from "@/components/editor";
import { use } from "react";

export default function DocEditorPage({ params }: { params: Promise<{ id: string }> }): ReactElement {
	const { id } = use(params);
	return <EditorShell documentId={id} />;
}

