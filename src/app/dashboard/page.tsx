import Link from "next/link";
import { SafeImage } from "@/frontend/components/safe-image";
import { redirect } from "next/navigation";
import { CheckCircle2, ExternalLink, Mail, Sparkles, UserRound } from "lucide-react";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { logout, updateOwnProfile } from "@/backend/auth/actions";
import { getAuthSessionState, getSavedPromptsForDashboard } from "@/backend/auth/session";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

function getInitials(value: string | null | undefined) {
  if (!value) return "P";
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await getAuthSessionState();

  if (!supabase || !user || !profile) {
    redirect("/login");
  }

  if (profile.status === "banned") {
    return (
      <MotionMain className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <MotionSection className="card-surface rounded-[32px] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-200">Account blocked</p>
          <h1 className="mt-3 text-3xl font-black text-white">Your account is currently banned.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Creator and dashboard actions are disabled for this account. {profile.ban_reason ? `Reason: ${profile.ban_reason}` : "Contact support if you believe this is a mistake."}
          </p>
          <form action={logout} className="mt-6">
            <button className="btn-primary">Log out</button>
          </form>
        </MotionSection>
      </MotionMain>
    );
  }

  const savedPrompts = await getSavedPromptsForDashboard(supabase, user.id);
  const displayName = profile.full_name ?? profile.display_name ?? user.email?.split("@")[0] ?? "PromptVault user";
  const avatarUrl = profile.avatar_url ?? (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null);

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <MotionSection className="card-surface rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {avatarUrl ? (
              <SafeImage src={avatarUrl} alt={displayName} width={64} height={64} className="h-16 w-16 rounded-2xl border border-white/10 object-cover" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-lg font-bold text-brand">
                {getInitials(displayName)}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Protected dashboard</p>
              <h1 className="mt-2 text-3xl font-black text-white">{displayName}</h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </span>
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  {profile.role}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                  {user.email_confirmed_at ? "Email verified" : "Verification pending"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/upload" className="btn-primary">
              <Sparkles className="h-4 w-4" />
              Upload prompt
            </Link>
            <Link href="/dashboard/packs/new" className="btn-ghost">Create pack</Link>
            <Link href="/dashboard/my-prompts" className="btn-ghost">My prompts</Link>
            <Link href="/" className="btn-ghost">Explore vault</Link>
          </div>
        </div>

        {(params.message || params.error) && (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${params.error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
            {params.error ?? params.message}
          </div>
        )}

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="panel rounded-2xl p-4">
            <p className="text-sm uppercase tracking-[0.22em] text-brand">Member since</p>
            <p className="mt-3 text-xl font-bold text-white">{formatDate(profile.created_at)}</p>
          </div>
          <div className="panel rounded-2xl p-4">
            <p className="text-sm uppercase tracking-[0.22em] text-brand">Saved prompts</p>
            <p className="mt-3 text-xl font-bold text-white">{savedPrompts.length}</p>
          </div>
          <div className="panel rounded-2xl p-4">
            <p className="text-sm uppercase tracking-[0.22em] text-brand">Account status</p>
            <p className="mt-3 text-xl font-bold text-white">{user.email_confirmed_at ? "Active" : "Verify email"}</p>
          </div>
        </div>
      </MotionSection>

      <MotionSection className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface rounded-[32px] p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Profile</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Update your account</h2>
            <p className="mt-2 text-sm text-slate-400">Keep your public creator identity accurate across the platform.</p>
          </div>

          <form action={updateOwnProfile} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="label">Full name</span>
              <input className="field" name="full_name" defaultValue={displayName} maxLength={80} />
            </label>
            <label className="block space-y-2">
              <span className="label">Avatar URL</span>
              <input className="field" name="avatar_url" type="url" defaultValue={avatarUrl ?? ""} placeholder="https://example.com/avatar.jpg" />
            </label>
            <button className="btn-primary">Save profile</button>
          </form>
        </div>

        <div className="card-surface rounded-[32px] p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand">Your vault</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Saved prompts</h2>
            </div>
            <Link href="/" className="text-sm text-brand transition hover:text-brand/80">Browse prompts</Link>
          </div>

          {!savedPrompts.length ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
              <p className="text-lg font-semibold text-white">No data yet. Start creating your first prompt.</p>
              <p className="mt-2 text-sm text-slate-400">Your saved prompts will appear here after you start using the vault.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/dashboard/upload" className="btn-primary">Create prompt</Link>
                <Link href="/" className="btn-ghost">Explore prompts</Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {savedPrompts.map((prompt) => (
                <Link key={prompt.id} href={prompt.href} className="group card-surface overflow-hidden rounded-[24px] transition duration-500 hover:-translate-y-1 hover:border-brand/40">
                  <div className="aspect-[4/3] overflow-hidden bg-black/30">
                    <SafeImage src={prompt.image_url} alt={prompt.title} width={640} height={480} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{prompt.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{prompt.category ?? "Prompt"}</p>
                      </div>
                      <ExternalLink className="mt-1 h-4 w-4 text-slate-500 transition group-hover:text-brand" />
                    </div>
                    {prompt.tags.length ? (
                      <div className="flex flex-wrap gap-2">
                        {prompt.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </MotionSection>
    </MotionMain>
  );
}
