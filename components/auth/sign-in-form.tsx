"use client";
import { useState, type ReactElement } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export interface SignInFormProps { onSuccess?: () => void }
/** Sign-in form using Convex password provider. */
export function SignInForm({ onSuccess }: SignInFormProps): ReactElement {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onSubmit = async (): Promise<void> => {
    setLoading(true); setError(null);
    try { 
      await signIn("password", { flow: "signIn", email, password }); 
      onSuccess?.(); 
    } catch(e:any){ 
      setError(e?.message ?? "Failed to sign in"); 
    } finally { 
      setLoading(false); 
    }
  };
  return (
    <form className="mt-4 grid gap-3" onSubmit={(e)=>{e.preventDefault(); void onSubmit();}}>
      <label className="grid gap-1 text-sm"><span>Email</span><input className="h-9 rounded-md border px-3" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/></label>
      <label className="grid gap-1 text-sm"><span>Password</span><input className="h-9 rounded-md border px-3" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required/></label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button type="submit" disabled={loading} className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-white disabled:opacity-50">{loading?"Signing in…":"Sign in"}</button>
    </form>
  );
}

