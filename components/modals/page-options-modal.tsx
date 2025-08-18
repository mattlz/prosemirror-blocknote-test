"use client";
import type { ReactElement } from "react";

interface PageOptionsModalProps {
	isOpen: boolean;
	onClose: () => void;
	showRemoteCursors: boolean;
	onToggleRemoteCursors: (val: boolean) => void;
}

export function PageOptionsModal({ isOpen, onClose, showRemoteCursors, onToggleRemoteCursors }: PageOptionsModalProps): ReactElement | null {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4" onClick={onClose}>
			<div className="mt-16 w-full max-w-md rounded-xl border bg-white p-4 shadow-sm" onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center justify-between">
					<h2 className="text-base font-semibold">Page Options</h2>
					<button className="text-sm text-neutral-500 hover:text-neutral-800" onClick={onClose}>Close</button>
				</div>
				<div className="mt-3 border-t pt-3">
					<div className="flex items-center justify-between py-2">
						<div>
							<div className="text-sm font-medium">Show collaborator cursors</div>
							<div className="text-xs text-neutral-500">Only affects visual cursors; collaboration continues.</div>
						</div>
						<button
							role="switch"
							aria-checked={showRemoteCursors}
							onClick={() => onToggleRemoteCursors(!showRemoteCursors)}
							className={["relative inline-flex h-6 w-10 items-center rounded-full transition-colors", showRemoteCursors ? "bg-blue-600" : "bg-neutral-300"].join(" ")}
						>
							<span className={["inline-block h-5 w-5 transform rounded-full bg-white transition-transform", showRemoteCursors ? "translate-x-4" : "translate-x-1"].join(" ")} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default PageOptionsModal;
