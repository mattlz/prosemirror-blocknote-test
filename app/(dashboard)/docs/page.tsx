"use client";
import Link from "next/link";
import { useMemo, useState, type ReactElement } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function DocsPage(): ReactElement {
	const { signOut } = useAuthActions();
	const router = useRouter();
	const docs = useQuery(api.documents.list, {}) ?? [];
	const create = useMutation(api.documents.create);
	const rename = useMutation(api.documents.rename);
	const remove = useMutation(api.documents.remove);

	const [filter, setFilter] = useState("");
	const filtered = useMemo(() => docs.filter((d: any) => d.title.toLowerCase().includes(filter.toLowerCase())), [docs, filter]);

	return (
		<div className="mx-auto max-w-5xl p-6">
			<header className="flex items-center gap-3">
				<h1 className="text-2xl font-semibold">Documents</h1>
				<div className="ml-auto flex items-center gap-2">
					<input className="h-9 rounded-md border px-3" placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} />
					<button className="inline-flex h-9 items-center rounded-md border px-3" onClick={async () => {
						const title = prompt("New document title", "Untitled Document") || "Untitled Document";
						await create({ title });
					}}>New</button>
					<button className="inline-flex h-9 items-center rounded-md border px-3" onClick={async () => { await signOut(); router.replace("/signin"); }}>Sign out</button>
				</div>
			</header>
			<div className="mt-4 overflow-hidden rounded-lg border">
				<table className="w-full text-left text-sm">
					<thead className="bg-neutral-50 text-neutral-600">
						<tr>
							<th className="px-3 py-2">Title</th>
							<th className="px-3 py-2 w-[160px]">Actions</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map((d: any) => (
							<tr key={d._id} className="border-t">
								<td className="px-3 py-2">
									<Link className="underline" href={`/docs/${d._id}`}>{d.title}</Link>
								</td>
								<td className="px-3 py-2">
									<div className="flex gap-2">
										<button className="inline-flex h-8 items-center rounded-md border px-2 text-xs" onClick={async () => {
											const title = prompt("Rename document", d.title) || d.title;
											await rename({ documentId: d._id, title });
										}}>Rename</button>
										<button className="inline-flex h-8 items-center rounded-md border px-2 text-xs" onClick={async () => {
											if (confirm("Delete document?")) await remove({ documentId: d._id });
										}}>Delete</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

