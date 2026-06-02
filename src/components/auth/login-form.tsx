"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordField } from "@/components/auth/password-field";

export function LoginForm({
  authEnabled,
  initialMessage,
  initialError,
  nextPath
}: {
  authEnabled: boolean;
  initialMessage?: string;
  initialError?: string;
  nextPath?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const safeNextPath = useMemo(() => (nextPath?.startsWith("/") ? nextPath : "/dashboard"), [nextPath]);

  useEffect(() => {
    if (initialMessage) toast.success(initialMessage);
    if (initialError) toast.error(initialError);
  }, [initialError, initialMessage]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authEnabled) {
      toast.error("Supabase Auth is not configured yet.");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        return;
      }

      toast.success("Logged in successfully.");
      router.push(safeNextPath);
      router.refresh();
    } catch (error) {
      toast.error(getAuthErrorMessage(error instanceof Error ? error.message : "Unable to sign in."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-bold text-white">Log in</h2>
        <p className="mt-2 text-sm text-slate-400">Access your dashboard, saved prompts, and creator tools.</p>
      </div>

      {!authEnabled ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Supabase Auth is not configured. Add the required environment variables before testing login.
        </div>
      ) : null}

      <OAuthButtons disabled={!authEnabled || isLoading} />

      <div className="relative flex items-center justify-center py-1 text-xs uppercase tracking-[0.24em] text-slate-500">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <span className="relative bg-[#091015] px-3">or continue with email</span>
      </div>

      <label className="block space-y-2">
        <span className="label">Email</span>
        <input
          className="field"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <PasswordField label="Password" name="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={setPassword} />

      <div className="flex items-center justify-between gap-3">
        <Link href="/forgot-password" className="text-sm text-brand transition hover:text-brand/80">
          Forgot password?
        </Link>
        <button className="btn-primary min-w-[10rem]" disabled={!authEnabled || isLoading}>
          {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? "Signing in..." : "Log in"}
        </button>
      </div>
    </form>
  );
}
