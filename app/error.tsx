"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<div className="p-6">
			<h2 className="text-lg font-semibold">Something went wrong</h2>
			<p className="mt-1 text-sm text-neutral-600">{error?.message ?? "Unknown error"}</p>
			<button className="mt-3 inline-flex h-9 items-center rounded-md border px-3" onClick={() => reset()}>Try again</button>
		</div>
	);
}
