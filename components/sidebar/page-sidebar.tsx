"use client";
import { useState, type ReactElement } from "react";
import { ChevronDown, ChevronRight, PanelLeftClose, Plus } from "lucide-react";
import { usePages } from "@/hooks";

interface PageSidebarProps {
	documentId: string | null;
	activePageDocId: string | null;
	onSelect: (docId: string) => void;
	onCreatePage: () => void;
	onCollapse: () => void;
}

export function PageSidebar(props: PageSidebarProps): ReactElement {
	const { pages, topLevelPages, childrenByParent, operations } = usePages(props.documentId);
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	return (
		<div className="w-64 h-full bg-white border-r p-2 transition-transform duration-300 ease-in-out">
			<div className="flex items-center justify-between px-1 py-2">
				<span className="text-xs font-semibold text-neutral-500">Pages</span>
				<button aria-label="Collapse sidebar" className="text-neutral-600 hover:text-neutral-900 transition-colors" onClick={props.onCollapse}><PanelLeftClose className="h-5 w-5" /></button>
			</div>
			<div className="flex flex-col gap-1">
				{topLevelPages.map((p: any, idx: number) => {
					const children = childrenByParent[String(p._id)] ?? [];
					const hasChildren = children.length > 0;
					const isExpanded = expanded[String(p._id)] ?? false;
					const siblings = topLevelPages;
					return (
						<div key={p._id} className="relative">
							<div className={["group relative flex items-center gap-2 rounded-md px-2 py-1", props.activePageDocId === p.docId ? "bg-neutral-100" : "hover:bg-neutral-50"].join(" ")}>
								{hasChildren ? (
									<button
										aria-label={isExpanded ? "Collapse" : "Expand"}
										className="text-neutral-500 hover:text-neutral-900"
										onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [String(p._id)]: !isExpanded })); }}
									>
										{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
									</button>
								) : <span className="w-4" />}
								<button onClick={() => props.onSelect(p.docId)} className="flex flex-1 items-center gap-2 text-left text-sm">
									<span className="text-sm">{p.icon ?? ""}</span>
									<span className="truncate">{p.title || "Untitled"}</span>
								</button>
								<button aria-label="Page menu" className="invisible h-6 w-6 rounded-md border text-xs group-hover:visible" onClick={() => setOpenMenuId(openMenuId === String(p._id) ? null : String(p._id))}>⋯</button>
								{openMenuId === String(p._id) ? (
									<div className="absolute right-2 top-7 z-20 w-44 rounded-md border bg-white p-1 shadow-md">
										<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
											const title = prompt("Rename page", p.title) || p.title;
											await operations.renamePage(p._id, title);
											setOpenMenuId(null);
										}}>Rename</button>
										{idx > 0 ? (
											<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
												await operations.reorderPage(p._id, siblings[idx - 1]._id);
												setOpenMenuId(null);
											}}>Move Up</button>
										) : null}
										{idx < siblings.length - 1 ? (
											<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
												const targetBefore = idx + 2 < siblings.length ? siblings[idx + 2]._id : undefined;
												if (targetBefore) {
													await operations.reorderPage(p._id, targetBefore);
												} else {
													await operations.reorderPage(p._id);
												}
												setOpenMenuId(null);
											}}>Move Down</button>
										) : null}
										<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
											const title = prompt("New subpage title", "Untitled page") || "Untitled page";
											const res = await operations.createSubpage(p._id, title);
											setExpanded((prev) => ({ ...prev, [String(p._id)]: true }));
											props.onSelect(res.docId);
											setOpenMenuId(null);
										}}>Add subpage</button>
										<button className="block w-full rounded px-2 py-1 text-left text-sm text-red-600 hover:bg-red-50" onClick={async () => {
											if (confirm("Delete page?")) {
												await operations.removePage(p._id);
												if (props.activePageDocId === p.docId) props.onSelect("");
											}
											setOpenMenuId(null);
										}}>Delete Page</button>
									</div>
								) : null}
							</div>

							{hasChildren && isExpanded ? (
								<div className="mt-1">
									{children.map((c: any, cIdx: number) => {
										const cSiblings = children;
										return (
											<div key={c._id} className={["group relative ml-4 flex items-center gap-2 rounded-md px-2 py-1", props.activePageDocId === c.docId ? "bg-neutral-100" : "hover:bg-neutral-50"].join(" ")}>
											<span className="w-4" />
											<button onClick={() => props.onSelect(c.docId)} className="flex flex-1 items-center gap-2 text-left text-sm">
												<span className="text-sm">{c.icon ?? ""}</span>
												<span className="truncate">{c.title || "Untitled"}</span>
											</button>
											<button aria-label="Page menu" className="invisible h-6 w-6 rounded-md border text-xs group-hover:visible" onClick={() => setOpenMenuId(openMenuId === String(c._id) ? null : String(c._id))}>⋯</button>
											{openMenuId === String(c._id) ? (
												<div className="absolute right-2 top-7 z-20 w-40 rounded-md border bg-white p-1 shadow-md">
													<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
														const title = prompt("Rename page", c.title) || c.title;
														await operations.renamePage(c._id, title);
														setOpenMenuId(null);
													}}>Rename</button>
													{cIdx > 0 ? (
														<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
															await operations.reorderPage(c._id, cSiblings[cIdx - 1]._id);
															setOpenMenuId(null);
														}}>Move Up</button>
													) : null}
													{cIdx < cSiblings.length - 1 ? (
														<button className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-neutral-100" onClick={async () => {
															const targetBefore = cIdx + 2 < cSiblings.length ? cSiblings[cIdx + 2]._id : undefined;
															if (targetBefore) {
																await operations.reorderPage(c._id, targetBefore);
															} else {
																await operations.reorderPage(c._id);
															}
															setOpenMenuId(null);
														}}>Move Down</button>
													) : null}
													<button className="block w-full rounded px-2 py-1 text-left text-sm text-red-600 hover:bg-red-50" onClick={async () => {
														if (confirm("Delete page?")) {
															await operations.removePage(c._id);
															if (props.activePageDocId === c.docId) props.onSelect("");
														}
														setOpenMenuId(null);
													}}>Delete Page</button>
												</div>
											) : null}
										</div>
									);
								})}
							</div>
						) : null}
					</div>
				);
			})}
			</div>
			<button className="mt-2 flex w-full items-center gap-1 px-2 py-1 text-left text-sm text-neutral-600 hover:text-neutral-900" onClick={props.onCreatePage} disabled={!props.documentId}><Plus className="h-4 w-4" /> New page</button>
		</div>
	);
}
