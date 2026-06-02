import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getAuthSessionState } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await getAuthSessionState();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Recover your PromptVault account"
      description="Request a secure reset link and choose a new password through Supabase Auth."
      footer={
        <>
          Remembered your password?{" "}
          <Link href="/login" className="text-brand transition hover:text-brand/80">Back to login</Link>
        </>
      }
    >
      <ForgotPasswordForm authEnabled={hasSupabaseEnv} initialMessage={params.message} initialError={params.error} />
    </AuthShell>
  );
}
