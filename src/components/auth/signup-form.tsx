"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getClientAuthErrorMessage } from "@/lib/auth/client-errors";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getAuthCallbackUrl } from "@/lib/auth/urls";
import { getEmailValidationError, getPasswordValidationError, normalizeEmail } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/client";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { PasswordField } from "@/components/auth/password-field";

export function SignupForm({
  authEnabled,
  initialMessage,
  initialError
}: {
  authEnabled: boolean;
  initialMessage?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setFormError(passwordError);
      toast.error(passwordError);
      return;
    }

    try {
      setIsLoading(true);
      setFormError(null);
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl("/dashboard"),
          data: {
            full_name: fullName.trim(),
            display_name: fullName.trim()
          }
        }
      });

      if (error) {
        const message = getAuthErrorMessage(error);
        setFormError(message);
        toast.error(message);
        return;
      }

      if (data.session) {
        toast.success("Account created.");
        router.push("/dashboard");
        router.refresh();
        return;
      }

      toast.success("Check your email to verify your account.");
      router.push("/login?message=Check%20your%20email%20to%20verify%20your%20account.");
      router.refresh();
    } catch (error) {
      const message = getClientAuthErrorMessage(error, "Unable to create account.");
      setFormError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div>
        <h2 className="text-2xl font-bold text-white">Create your account</h2>
        <p className="mt-2 text-sm text-slate-400">Set up your PromptVault account with email or a provider.</p>
      </div>

      {!authEnabled ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Supabase Auth is not configured. Add the required environment variables before testing signup.
        </div>
      ) : null}

      {formError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100" role="alert">
          {formError}
        </div>
      ) : null}

      <OAuthButtons authEnabled={authEnabled} disabled={isLoading} />
      <div className="relative flex items-center justify-center py-1 text-xs uppercase tracking-[0.24em] text-slate-500">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <span className="relative bg-[#091015] px-3">or continue with email</span>
      </div>

      <label className="block space-y-2">
        <span className="label">Full name</span>
        <input
          className="field"
          name="full_name"
          autoComplete="name"
          placeholder="Your name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          minLength={2}
          maxLength={80}
          disabled={!authEnabled || isLoading}
        />
      </label>

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

      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={setPassword}
        disabled={!authEnabled || isLoading}
      />

      <button className="btn-primary w-full justify-center" disabled={!authEnabled || isLoading}>
        {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Creating account..." : "Sign up"}
      </button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-brand transition hover:text-brand/80">
          Log in
        </Link>
      </p>
    </form>
  );
}
