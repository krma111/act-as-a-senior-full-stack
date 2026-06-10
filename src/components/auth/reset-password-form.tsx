"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getClientAuthErrorMessage } from "@/lib/auth/client-errors";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getPasswordValidationError } from "@/lib/auth/validation";
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
  const [isCheckingSession, setIsCheckingSession] = useState(authEnabled);
  const [hasSession, setHasSession] = useState(hasRecoverySession);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMessage) toast.success(initialMessage);
    if (initialError) toast.error(initialError);
  }, [initialError, initialMessage]);

  useEffect(() => {
    if (!authEnabled) {
      setIsCheckingSession(false);
      return;
    }

    let active = true;
    const supabase = createClient();

    async function prepareRecoverySession() {
      try {
        const query = new URLSearchParams(window.location.search);
        const code = query.get("code");
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const hashError = hash.get("error_description") || hash.get("error");

        if (hashError) {
          const message = decodeURIComponent(hashError);
          setFormError(message);
          toast.error(message);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            const message = getAuthErrorMessage(error);
            setFormError(message);
            toast.error(message);
          } else {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            setFormError(getAuthErrorMessage(error));
            toast.error(getAuthErrorMessage(error));
          } else {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }

        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (active) setHasSession(Boolean(session));
      } catch (error) {
        const message = getClientAuthErrorMessage(error, "Unable to validate recovery link.");
        if (active) setFormError(message);
        toast.error(message);
      } finally {
        if (active) setIsCheckingSession(false);
      }
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(Boolean(session));
    });

    prepareRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authEnabled]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authEnabled) {
      setFormError("Supabase is not configured");
      toast.error("Supabase is not configured");
      return;
    }

    if (!hasSession) {
      setFormError("Your recovery session is missing or expired.");
      toast.error("Your recovery session is missing or expired.");
      return;
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setFormError(passwordError);
      toast.error(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      setFormError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        const message = getAuthErrorMessage(error);
        setFormError(message);
        toast.error(message);
        return;
      }

      toast.success("Password updated.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message = getClientAuthErrorMessage(error, "Unable to update password.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-white">Checking recovery link</h2>
        <p className="text-sm text-slate-400">Please wait while PromptVault verifies your password reset session.</p>
        <LoaderCircle className="h-5 w-5 animate-spin text-brand" />
      </div>
    );
  }

  if (!hasSession) {
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
          <Link href="/forgot-password" className="btn-primary">
            Request a new link
          </Link>
          <Link href="/login" className="btn-ghost">
            Back to login
          </Link>
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

      {!authEnabled ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Supabase Auth is not configured. Add the required environment variables before testing password reset.
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100" role="alert">
          {formError}
        </div>
      ) : null}

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="label">New password</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            placeholder="At least 8 characters"
            required
            disabled={!authEnabled || isLoading}
          />
        </label>
        <label className="block space-y-2">
          <span className="label">Confirm password</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
            disabled={!authEnabled || isLoading}
          />
        </label>
      </div>

      <button
        className="btn-primary w-full justify-center"
        disabled={!authEnabled || isLoading}
      >
        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
}
