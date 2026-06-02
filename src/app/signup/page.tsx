import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getAuthSessionState } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SignupPage({
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
      eyebrow="Create account"
      title="Build your creator vault"
      description="Create a real account with Supabase Auth and keep your saved prompts, profile, and creator workflow in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-brand transition hover:text-brand/80">Log in</Link>
        </>
      }
    >
      <SignupForm authEnabled={hasSupabaseEnv} initialMessage={params.message} initialError={params.error} />
    </AuthShell>
  );
}
