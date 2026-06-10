import { AuthShell } from "@/frontend/components/auth/auth-shell";
import { ResetPasswordForm } from "@/frontend/components/auth/reset-password-form";
import { getAuthSessionState } from "@/backend/auth/session";
import { hasSupabaseEnv } from "@/backend/env";

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
