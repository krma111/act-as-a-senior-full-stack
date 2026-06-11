import { redirect } from "next/navigation";
import { AuthShell } from "@/frontend/components/auth/auth-shell";
import { LoginForm } from "@/frontend/components/auth/login-form";
import { getAuthSessionState } from "@/backend/auth/session";
import { hasSupabaseEnv } from "@/backend/env";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const { user, profile } = await getAuthSessionState();

  if (user) {
    redirect(profile?.role === "admin" ? "/admin" : "/");
  }

  return (
    <AuthShell
      eyebrow="Secure access"
      title="PromptVault admin access"
      description="Sign in only if you manage prompt packs, UPI settings, and buyer orders."
      footer="Public buyers do not need an account. Purchases work with email checkout only."
    >
      <LoginForm authEnabled={hasSupabaseEnv} initialMessage={params.message} initialError={params.error} nextPath={params.next} />
    </AuthShell>
  );
}
