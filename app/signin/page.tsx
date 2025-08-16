"use client";
import { useState, type ReactElement } from "react";
import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage(): ReactElement {
	const { signIn } = useAuthActions();
	const token = useAuthToken();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (token) {
		router.replace("/docs");
	}

	const onSubmit = async (): Promise<void> => {
		setLoading(true);
		setError(null);
		try {
			await signIn("password", { flow: "signIn", email, password });
			router.replace("/docs");
		} catch (e: any) {
			setError(e?.message ?? "Failed to sign in");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="grid min-h-dvh place-items-center p-6">
			<div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
				<h1 className="text-xl font-semibold">Sign in</h1>
				<p className="mt-1 text-sm text-neutral-600">Use your email and password</p>
				<form
					className="mt-4 grid gap-3"
					onSubmit={(e) => { e.preventDefault(); void onSubmit(); }}
				>
					<label className="grid gap-1 text-sm">
						<span>Email</span>
						<input className="h-9 rounded-md border px-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
					</label>
					<label className="grid gap-1 text-sm">
						<span>Password</span>
						<input className="h-9 rounded-md border px-3" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
					</label>
					{error ? <p className="text-sm text-red-600">{error}</p> : null}
					<button type="submit" disabled={loading} className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-white disabled:opacity-50">
						{loading ? "Signing in…" : "Sign in"}
					</button>
				</form>
				<p className="mt-3 text-sm text-neutral-600">
					No account? <Link className="underline" href="/signup">Create one</Link>
				</p>
			</div>
		</div>
	);
}
