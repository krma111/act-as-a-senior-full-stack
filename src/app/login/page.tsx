import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthSessionState } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const { user } = await getAuthSessionState();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="Secure access"
      title="Welcome back to PromptVault"
      description="Sign in to access your prompt vault, manage saved content, and continue building your creator library."
      footer={
        <>
          Need an account?{" "}
          <Link href="/signup" className="text-brand transition hover:text-brand/80">Create one</Link>
        </>
      }
    >
      <LoginForm authEnabled={hasSupabaseEnv} initialMessage={params.message} initialError={params.error} nextPath={params.next} />
    </AuthShell>
  );
}
