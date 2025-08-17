"use client";
import type { ReactElement } from "react";
import { ArrowLeft, MessageCircle, PanelLeftOpen } from "lucide-react";
import { PresenceAvatars } from "@/components/editor";

interface TopBarProps {
	documentTitle: string;
	docId: string | null;
	onToggleComments: () => void;
	commentsOpen: boolean;
}

export function TopBar({ documentTitle, docId, onToggleComments, commentsOpen }: TopBarProps): ReactElement {
	return (
		<div className="sticky top-0 z-10 flex w-full items-center gap-3 border-b bg-white px-4 py-2">
			<button className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-sm" onClick={() => { window.location.href = "/docs"; }}><ArrowLeft className="h-4 w-4" /> All docs</button>
			<div className="text-lg font-semibold">{documentTitle}</div>
			<div className="ml-auto flex items-center gap-2">
				<button aria-label="Comments" className={["inline-flex h-8 w-8 items-center justify-center rounded-md border", commentsOpen ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={onToggleComments}><MessageCircle className="h-4 w-4" /></button>
				<PresenceAvatars docId={docId} />
			</div>
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
