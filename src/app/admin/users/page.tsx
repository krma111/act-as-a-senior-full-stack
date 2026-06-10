import { SafeImage } from "@/frontend/components/safe-image";
import Link from "next/link";
import { AdminTabs } from "@/frontend/components/admin-tabs";
import { CreatorBadge } from "@/frontend/components/creator-badge";
import { MotionMain, MotionSection } from "@/frontend/components/motion-primitives";
import { updateUserBadge, updateUserBan, updateUserRole } from "@/backend/actions/admin";
import { getAdminUsers } from "@/backend/data/admin";
import { creatorBadges, resolveCreatorBadge } from "@/backend/creators/badges";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return value;
  }
}

function initials(value: string) {
  return (
    value
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P"
  );
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { users, error } = await getAdminUsers();

  return (
    <MotionMain className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Users" />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="hero-title mt-2 text-3xl font-black">Users</h1>
          <p className="mt-2 text-sm text-slate-400">Real Supabase profiles. Change roles without using fake user data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="btn-ghost">Admin home</Link>
          <Link href="/admin/prompts" className="btn-primary">Manage prompts</Link>
        </div>
      </div>

      {(params.message || params.error || error) && (
        <div className={`mb-6 rounded-2xl border p-4 text-sm ${params.error || error ? "border-red-500/30 bg-red-500/10 text-red-100" : "border-brand/30 bg-brand/10 text-brand"}`}>
          {params.error ?? error ?? params.message}
        </div>
      )}

      <MotionSection className="grid gap-4">
        {users.map((user) => {
          const name = user.full_name ?? user.display_name ?? user.email ?? "PromptVault user";
          const currentBadge = resolveCreatorBadge(user);
          const manualBadgeType = user.manual_badge_override ? user.manual_badge_type ?? "none" : "none";
          return (
            <article key={user.id} className="card-surface rounded-[28px] p-5 transition duration-500 hover:-translate-y-1 hover:border-brand/40">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  {user.avatar_url ? (
                    <SafeImage src={user.avatar_url} alt={name} width={56} height={56} className="h-14 w-14 rounded-2xl border border-white/10 object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-sm font-bold text-brand">
                      {initials(name)}
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-bold text-white">{name}</p>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Joined {formatDate(user.created_at)}</span>
                      <span>Copies {user.copy_total ?? 0}</span>
                      <span>Prompts {user.prompt_count ?? 0}</span>
                      <span className={user.status === "banned" ? "rounded-full bg-red-500/10 px-2 py-1 text-red-100" : "rounded-full bg-brand/10 px-2 py-1 text-brand"}>
                        {user.status ?? "active"}
                      </span>
                      <CreatorBadge profile={user} compact hideEmpty={false} />
                      <span>{user.manual_badge_override ? "manual crown" : `auto crown: ${currentBadge.shortLabel}`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <form action={updateUserRole} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="id" value={user.id} />
                    <select className="field min-w-[150px]" name="role" defaultValue={user.role}>
                      <option value="user">user</option>
                      <option value="creator">creator</option>
                      <option value="admin">admin</option>
                    </select>
                    <button className="btn-primary">Update role</button>
                  </form>
                  <form action={updateUserBadge} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="id" value={user.id} />
                    <select className="field min-w-[190px]" name="manual_badge_type" defaultValue={manualBadgeType}>
                      {Object.values(creatorBadges).map((badge) => (
                        <option key={badge.type} value={badge.type}>
                          {badge.label}
                        </option>
                      ))}
                    </select>
                    <button className="btn-ghost">Update crown</button>
                  </form>
                  <form action={updateUserBan} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="ban" value={String(user.status !== "banned")} />
                    {user.status === "banned" ? null : (
                      <input className="field min-w-[220px]" name="ban_reason" placeholder="Ban reason optional" />
                    )}
                    <button className={user.status === "banned" ? "btn-primary" : "btn-ghost text-red-100"}>
                      {user.status === "banned" ? "Unban user" : "Ban user"}
                    </button>
                  </form>
                  <Link href={`/admin/prompts?user=${user.id}`} className="text-sm font-semibold text-brand hover:text-white">
                    View submissions
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </MotionSection>

      {!users.length ? (
        <MotionSection className="card-surface rounded-[32px] p-10 text-center">
          <p className="text-xl font-bold text-white">No users found.</p>
        </MotionSection>
      ) : null}
    </MotionMain>
  );
}
