"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm({
  authEnabled,
  hasRecoverySession,
  initialMessage,
  initialError
}: {
  authEnabled: boolean;
  hasRecoverySession: boolean;
  initialMessage?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

    if (!hasRecoverySession) {
      toast.error("Your recovery session is missing or expired.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        return;
      }

      toast.success("Password updated.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(getAuthErrorMessage(error instanceof Error ? error.message : "Unable to update password."));
    } finally {
      setIsLoading(false);
    }
  }

  if (!hasRecoverySession) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-white">Recovery link required</h2>
          <p className="mt-2 text-sm text-slate-400">Open the recovery link from your email to set a new password.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          This page needs an active password recovery session from Supabase Auth.
        </div>
        <div className="flex gap-3">
          <Link href="/forgot-password" className="btn-primary">Request a new link</Link>
          <Link href="/login" className="btn-ghost">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-bold text-white">Choose a new password</h2>
        <p className="mt-2 text-sm text-slate-400">Set a secure password for your PromptVault account.</p>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="label">New password</span>
          <input className="field" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="At least 8 characters" required />
        </label>
        <label className="block space-y-2">
          <span className="label">Confirm password</span>
          <input className="field" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
        </label>
      </div>

      <button className="btn-primary w-full justify-center" disabled={!authEnabled || isLoading}>
        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
}
