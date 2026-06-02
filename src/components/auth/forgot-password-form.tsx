"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getPasswordResetRedirectUrl } from "@/lib/auth/urls";
import { getEmailValidationError, normalizeEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm({
  authEnabled,
  initialMessage,
  initialError
}: {
  authEnabled: boolean;
  initialMessage?: string;
  initialError?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMessage) toast.success(initialMessage);
    if (initialError) toast.error(initialError);
  }, [initialError, initialMessage]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authEnabled) {
      setFormError("Supabase is not configured");
      toast.error("Supabase is not configured");
      return;
    }

    const emailError = getEmailValidationError(email);
    if (emailError) {
      setFormError(emailError);
      toast.error(emailError);
      return;
    }

    try {
      setIsLoading(true);
      setFormError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
        redirectTo: getPasswordResetRedirectUrl()
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setFormError(message);
        toast.error(message);
        return;
      }

      toast.success("Password reset email sent.");
    } catch (error) {
      const message = getAuthErrorMessage(error instanceof Error ? error.message : "Unable to send reset email.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-bold text-white">Reset your password</h2>
        <p className="mt-2 text-sm text-slate-400">Enter your account email and we will send a secure recovery link.</p>
      </div>

      {!authEnabled ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Supabase Auth is not configured. Add the required environment variables before testing recovery emails.
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100" role="alert">
          {formError}
        </div>
      ) : null}

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
          disabled={!authEnabled || isLoading}
          inputMode="email"
        />
      </label>

      <button className="btn-primary w-full justify-center" disabled={!authEnabled || isLoading}>
        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Sending reset link..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-slate-400">
        Back to{" "}
        <Link href="/login" className="text-brand transition hover:text-brand/80">
          login
        </Link>
      </p>
    </form>
  );
}
