"use client";
import type { ReactElement } from "react";
import { ArrowLeft, MessageCircle, PanelLeftOpen, Settings, Share2 } from "lucide-react";
import { PresenceAvatars } from "@/components/editor";
import { BlockInsertButton } from "@/components/editor/custom-blocks/block-insert-button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui";

interface TopBarProps {
	documentTitle: string;
	// Page-level docId (used by presence avatars)
	docId: string | null;
	// Database document id (used for publish/share)
	documentId?: string | null;
	// Read-only view (shared)
	readOnly?: boolean;
	onToggleComments: () => void;
	commentsOpen: boolean;
	optionsOpen: boolean;
	onToggleOptions: () => void;
	editor?: any;
}

export function TopBar({ documentTitle, docId, documentId, readOnly = false, onToggleComments, commentsOpen, optionsOpen, onToggleOptions, editor }: TopBarProps): ReactElement {
	const documents = useQuery(api.documents.list, {}) as any[] | undefined;
	const currentDoc = useMemo(() => (documents ?? []).find(d => String(d._id) === String(documentId ?? "")) ?? null, [documents, documentId]);
	const publishMutation = useMutation(api.documents.publish);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const [localShareId, setLocalShareId] = useState<string | null>(null);
	const effectiveShareId = localShareId ?? ((currentDoc as any)?.shareId ?? null);
	const shareUrl = typeof window !== "undefined" && effectiveShareId ? `${window.location.origin}/s/${effectiveShareId}` : null;

	return (
		<div className="sticky top-0 z-10 flex w-full items-center gap-3 border-b bg-white px-4 py-2">
			{!readOnly ? (
				<button className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-sm" onClick={() => { window.location.href = "/docs"; }}><ArrowLeft className="h-4 w-4" /> All docs</button>
			) : null}
			<div className="text-lg font-semibold">{documentTitle}</div>
			<div className="ml-auto flex items-center gap-2">
				{!readOnly && editor ? <BlockInsertButton editor={editor} /> : null}
				<button aria-label="Comments" className={["inline-flex h-8 w-8 items-center justify-center rounded-md border", commentsOpen ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={onToggleComments}><MessageCircle className="h-4 w-4" /></button>
				{!readOnly ? (
					<button aria-label="Page options" className={["inline-flex h-8 w-8 items-center justify-center rounded-md border", optionsOpen ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={onToggleOptions}><Settings className="h-4 w-4" /></button>
				) : null}
				{!readOnly ? <PresenceAvatars docId={docId} /> : null}
				<div>
					<Button
						variant="default"
						onClick={async () => {
							if (!effectiveShareId) {
								setDialogOpen(true);
							} else {
								setDialogOpen(true);
							}
						}}
					>
						<Share2 className="h-4 w-4 mr-1" /> {effectiveShareId ? "Share" : "Publish"}
					</Button>
				</div>
			</div>

			{dialogOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDialogOpen(false)}>
					<div className="w-[420px] rounded-lg border bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
						{!effectiveShareId ? (
							<div>
								<h3 className="mb-2 text-lg font-semibold">Publish document?</h3>
								<p className="mb-4 text-sm text-neutral-600">This will create a read-only share link anyone can view.</p>
								<div className="flex justify-end gap-2">
									<button className="inline-flex h-8 items-center rounded-md border px-2" onClick={() => setDialogOpen(false)}>Cancel</button>
									<Button onClick={async () => {
										if (!currentDoc?._id) return;
										setPublishing(true);
										try {
											const r = await publishMutation({ documentId: currentDoc._id });
											setLocalShareId((r as any)?.shareId ?? null);
										} finally {
											setPublishing(false);
										}
									}} disabled={publishing}>{publishing ? "Publishing..." : "Publish"}</Button>
								</div>
							</div>
						) : (
							<div>
								<h3 className="mb-2 text-lg font-semibold">Share document</h3>
								<div className="mb-3 break-all rounded-md border px-2 py-1 text-sm">{shareUrl}</div>
								<div className="flex justify-end gap-2">
									<Button onClick={() => { if (shareUrl) navigator.clipboard.writeText(shareUrl); }}>Copy link</Button>
									{!readOnly ? (
										<Button onClick={() => { if (shareUrl) window.open(shareUrl, "_blank"); }}>View</Button>
									) : null}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export function SidebarOpenButton({ onOpen }: { onOpen: () => void }): ReactElement {
	return (
		<button 
			aria-label="Open sidebar" 
			className="absolute left-4 top-2 z-20 text-neutral-600 hover:text-neutral-900 transition-all duration-300 ease-in-out animate-in fade-in"
			onClick={onOpen}
		>
			<PanelLeftOpen className="h-5 w-5" />
		</button>
	);
}
