import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getAuthSessionState } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await getAuthSessionState();

  return (
    <AuthShell eyebrow="Password reset" title="Set a new password" description="Finish the secure recovery flow and update your account password.">
      <ResetPasswordForm authEnabled={hasSupabaseEnv} hasRecoverySession={Boolean(user)} initialMessage={params.message} initialError={params.error} />
    </AuthShell>
  );
}
