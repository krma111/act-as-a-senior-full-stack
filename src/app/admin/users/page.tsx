import Image from "next/image";
import Link from "next/link";
import { CreatorBadge } from "@/components/creator-badge";
import { updateUserBadge, updateUserRole } from "@/lib/admin-actions";
import { getAdminUsers } from "@/lib/admin-data";
import { creatorBadges, resolveCreatorBadge } from "@/lib/creator-badges";

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
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
          <h1 className="mt-2 text-3xl font-black text-white">Users</h1>
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

      <section className="grid gap-4">
        {users.map((user) => {
          const name = user.full_name ?? user.display_name ?? user.email ?? "PromptVault user";
          const currentBadge = resolveCreatorBadge(user);
          const manualBadgeType = user.manual_badge_override ? user.manual_badge_type ?? "none" : "none";
          return (
            <article key={user.id} className="card-surface rounded-[24px] p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={name} width={56} height={56} className="h-14 w-14 rounded-2xl border border-white/10 object-cover" />
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
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!users.length ? (
        <section className="card-surface rounded-[28px] p-10 text-center">
          <p className="text-xl font-bold text-white">No users found.</p>
        </section>
      ) : null}
    </main>
  );
}
