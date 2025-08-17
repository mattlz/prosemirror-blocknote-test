"use client";
import { useEffect, useRef, useState, type ReactElement } from "react";
import EmojiPicker from "emoji-picker-react";
import { SmilePlus } from "lucide-react";

interface IconPickerProps {
	value?: string | null;
	onChange: (val: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps): ReactElement {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
		document.addEventListener("click", onDoc);
		return () => document.removeEventListener("click", onDoc);
	}, []);
	return (
		<div className="relative inline-block" ref={ref}>
			{value ? (
				<button className="text-5xl leading-none hover:opacity-70 transition-opacity" onClick={() => setOpen((v) => !v)}>
					{value}
				</button>
			) : (
				<button className="inline-flex h-10 w-10 items-center justify-center rounded-md border bg-white text-lg text-neutral-400 hover:text-neutral-600" onClick={() => setOpen((v) => !v)}>
					<SmilePlus className="h-6 w-6" />
				</button>
			)}
			{open && (
				<div className="absolute z-20 mt-2">
					<EmojiPicker
						onEmojiClick={(emojiData) => {
							onChange(emojiData.emoji);
							setOpen(false);
						}}
						width={320}
						height={400}
					/>
					<button 
						className="mt-2 w-full rounded border px-2 py-1 text-xs bg-white hover:bg-neutral-50" 
						onClick={() => { onChange(null); setOpen(false); }}
					>
						Remove
					</button>
				</div>
			)}
		</div>
	);
}
