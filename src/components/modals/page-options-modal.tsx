"use client";
import type { ReactElement } from "react";

interface PageOptionsModalProps {
	isOpen: boolean;
	onClose: () => void;
	showCursorLabels?: boolean;
	onToggleCursorLabels?: (val: boolean) => void;
	pageWidth?: "default" | "full";
	onChangePageWidth?: (val: "default" | "full") => void;
	theme?: "light" | "dark";
	onChangeTheme?: (val: "light" | "dark") => void;
}

export function PageOptionsModal({ isOpen, onClose, showCursorLabels = true, onToggleCursorLabels, pageWidth = "default", onChangePageWidth, theme = "light", onChangeTheme }: PageOptionsModalProps): ReactElement | null {
	if (!isOpen) return null;
	const isDark = theme === "dark";
	const surface = ["mt-16 w-full max-w-md rounded-xl border p-4 shadow-sm", isDark ? "bg-neutral-900 text-neutral-100 border-neutral-700" : "bg-white"].join(" ");
	const closeBtn = ["text-sm", isDark ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-800"].join(" ");
	const switchTrack = (on: boolean) => ["relative inline-flex h-6 w-10 items-center rounded-full transition-colors", on ? "bg-blue-600" : (isDark ? "bg-neutral-700" : "bg-neutral-300")].join(" ");
	const switchThumb = (on: boolean) => ["inline-block h-5 w-5 transform rounded-full bg-white transition-transform", on ? "translate-x-4" : "translate-x-1"].join(" ");
	const segBtn = (active: boolean) => ["rounded-md border px-2 py-1 text-sm", active ? "border-blue-500 text-blue-600" : (isDark ? "border-neutral-700 text-neutral-300" : "border-neutral-300 text-neutral-700")].join(" ");
	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4" onClick={onClose}>
			<div className={surface} onClick={(e) => e.stopPropagation()}>
				<div className="flex items-center justify-between">
					<h2 className="text-base font-semibold">Page Options</h2>
					<button className={closeBtn} onClick={onClose}>Close</button>
				</div>
				<div className="mt-3 border-t pt-3">

					<div className="flex items-center justify-between py-2">
						<div>
							<div className="text-sm font-medium">Show cursor labels</div>
							<div className={isDark ? "text-xs text-neutral-400" : "text-xs text-neutral-500"}>Toggle collaborator name tags above carets.</div>
						</div>
						<button
							role="switch"
							aria-checked={!!showCursorLabels}
							onClick={() => onToggleCursorLabels?.(!showCursorLabels)}
							className={switchTrack(!!showCursorLabels)}
						>
							<span className={switchThumb(!!showCursorLabels)} />
						</button>
					</div>
					<div className="flex items-center justify-between py-2">
						<div>
							<div className="text-sm font-medium">Page width</div>
							<div className={isDark ? "text-xs text-neutral-400" : "text-xs text-neutral-500"}>Choose the content area width.</div>
						</div>
						<div className="flex items-center gap-2">
							<button className={segBtn(pageWidth === "default")} onClick={() => onChangePageWidth?.("default")}>
								Default
							</button>
							<button className={segBtn(pageWidth === "full")} onClick={() => onChangePageWidth?.("full")}>
								Full width
							</button>
						</div>
					</div>
					<div className="flex items-center justify-between py-2">
						<div>
							<div className="text-sm font-medium">Theme</div>
							<div className={isDark ? "text-xs text-neutral-400" : "text-xs text-neutral-500"}>Switch between light and dark mode.</div>
						</div>
						<div className="flex items-center gap-2">
							<button className={segBtn(theme === "light")} onClick={() => onChangeTheme?.("light")}>
								Light
							</button>
							<button className={segBtn(theme === "dark")} onClick={() => onChangeTheme?.("dark")}>
								Dark
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default PageOptionsModal;
