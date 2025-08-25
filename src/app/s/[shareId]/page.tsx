"use client";
import { use } from "react";
import type { ReactElement } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EditorShell } from "@/components/editor";

export default function SharedDocPage({ params }: { params: Promise<{ shareId: string }> }): ReactElement {
  const { shareId } = use(params);
  const doc = useQuery(api.documents.getByShareId, { shareId });

  if (doc === undefined) {
    return <div className="p-6">Loading…</div> as any;
  }
  if (doc === null) {
    return <div className="p-6">This shared document link is invalid or has been revoked.</div> as any;
  }

  // Render the regular shell in read-only mode; it will pick the first page automatically
  return <EditorShell documentId={doc._id as any} readOnly /> as any;
}


