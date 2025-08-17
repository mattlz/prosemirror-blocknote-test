"use client";
import type { ReactElement } from "react";
import { EditorShell } from "@/components/editor";

export default function DocEditorPage({ params }: { params: { id: string } }): ReactElement {
	return <EditorShell documentId={params.id} /> as any;
}

