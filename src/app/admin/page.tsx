import { EyeOff, Sparkles, Trash2 } from "lucide-react";
import {
  adminDeletePrompt,
  adminHideReportedPrompt,
  adminTogglePromptFlag,
  adminUpdateReport,
  assertAdmin,
  deleteCategory,
  saveSiteSettings,
  upsertCategory
} from "@/lib/actions";
import { demoCategories, demoPrompts, demoSettings } from "@/lib/demo-data";
import { isPreviewMode } from "@/lib/env";
import { getPreviewUser } from "@/lib/preview-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category, Prompt, Profile, ReportWithRelations, SiteSettings } from "@/lib/types";

export default async function AdminDashboard({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const currentAdmin = isPreviewMode ? await getPreviewUser() : await assertAdmin();
  if (!currentAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="panel rounded-lg p-6">
          <p className="text-sm uppercase tracking-wide text-brand">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">Log in required</h1>
          <p className="mt-2 text-slate-400">Use the configured admin email to access the control panel.</p>
        </section>
      </main>
    );
  }
  if (isPreviewMode && (currentAdmin.role !== "admin" || (currentAdmin.email ?? "").toLowerCase() !== process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase())) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="panel rounded-lg p-6">
          <p className="text-sm uppercase tracking-wide text-brand">Admin</p>
          <h1 className="mt-2 text-3xl font-bold">Access denied</h1>
          <p className="mt-2 text-slate-400">Only the configured admin email can open this dashboard.</p>
        </section>
      </main>
    );
  }
  const previewReports: ReportWithRelations[] = [
    {
      id: "preview-report",
      prompt_id: "demo-1",
      reason: "Example report for moderation workflow.",
      status: "open",
      created_at: new Date().toISOString(),
      prompts: { id: "demo-1", title: "Neon editorial portrait", hidden: false },
      users: { email: "reporter@example.com" }
    }
  ];
  const previewUsers: Profile[] = [
    {
      id: currentAdmin.id,
      email: currentAdmin.email ?? "admin@example.com",
      display_name: "Preview Admin",
      avatar_url: null,
      role: "admin",
      created_at: new Date().toISOString()
    }
  ];

  const admin = isPreviewMode ? null : createAdminClient();
  const [{ data: settings }, { data: categories }, { data: users }, { data: prompts }, { data: reports }] =
    isPreviewMode
      ? [
          { data: demoSettings },
          { data: demoCategories },
          { data: previewUsers },
          { data: demoPrompts },
          { data: previewReports }
        ]
      : await Promise.all([
      admin!.from("site_settings").select("*").eq("id", 1).single(),
      admin!.from("categories").select("*").order("name"),
      admin!.from("users").select("*").order("created_at", { ascending: false }),
      admin!.from("prompts").select("*, categories(*), users(*)").order("created_at", { ascending: false }),
      admin!.from("reports").select("*, prompts(id,title,hidden), users(email)").order("created_at", { ascending: false })
    ]);

  const siteSettings = settings as SiteSettings | null;
  const settingFields: Array<[keyof Pick<SiteSettings, "website_name" | "logo_text" | "hero_headline" | "hero_subheadline" | "footer_text">, string]> = [
    ["website_name", "Website name"],
    ["logo_text", "Logo text"],
    ["hero_headline", "Hero headline"],
    ["hero_subheadline", "Hero subheadline"],
    ["footer_text", "Footer text"]
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-wide text-brand">Admin</p>
        <h1 className="text-3xl font-black">PromptHub control panel</h1>
        {params.message && <p className="mt-4 rounded-lg border border-brand/30 bg-brand/10 p-3 text-sm text-brand">{params.message}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form action={saveSiteSettings} className="panel space-y-4 rounded-lg p-6">
          <h2 className="text-xl font-bold">Website settings</h2>
          {settingFields.map(([name, label]) => (
            <label key={name} className="block space-y-2">
              <span className="label">{label}</span>
              <input className="field" name={name} defaultValue={siteSettings?.[name] ?? ""} required />
            </label>
          ))}
          <button className="btn-primary">Save settings</button>
        </form>

        <section className="panel rounded-lg p-6">
          <h2 className="text-xl font-bold">Categories</h2>
          <form action={upsertCategory} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input className="field" name="name" placeholder="Category name" required />
            <input className="field" name="slug" placeholder="slug" required />
            <button className="btn-primary">Add</button>
            <textarea className="field sm:col-span-3" name="description" placeholder="Short description" />
          </form>
          <div className="mt-5 grid gap-3">
            {((categories ?? []) as Category[]).map((category) => (
              <div key={category.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <form action={upsertCategory} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input type="hidden" name="id" value={category.id} />
                  <input className="field" name="name" defaultValue={category.name} />
                  <input className="field" name="slug" defaultValue={category.slug} />
                  <button className="btn-ghost">Update</button>
                  <input className="field sm:col-span-3" name="description" defaultValue={category.description ?? ""} />
                </form>
                <form action={deleteCategory} className="mt-2">
                  <input type="hidden" name="id" value={category.id} />
                  <button className="btn-ghost text-red-200"><Trash2 className="h-4 w-4" /> Delete category</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-8 panel rounded-lg p-6">
        <h2 className="text-xl font-bold">Prompts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-slate-400">
              <tr><th className="py-3">Title</th><th>Creator</th><th>Stats</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {((prompts ?? []) as Prompt[]).map((prompt) => (
                <tr key={prompt.id}>
                  <td className="py-3 font-medium">{prompt.title}</td>
                  <td>{prompt.users?.email}</td>
                  <td>{prompt.like_count} likes, {prompt.copy_count} copies</td>
                  <td>{prompt.featured ? "Featured" : "Standard"} / {prompt.hidden ? "Hidden" : "Visible"}</td>
                  <td className="flex gap-2 py-3">
                    <form action={adminTogglePromptFlag}>
                      <input type="hidden" name="id" value={prompt.id} />
                      <input type="hidden" name="field" value="featured" />
                      <input type="hidden" name="value" value={String(!prompt.featured)} />
                      <button className="btn-ghost"><Sparkles className="h-4 w-4" /> Feature</button>
                    </form>
                    <form action={adminTogglePromptFlag}>
                      <input type="hidden" name="id" value={prompt.id} />
                      <input type="hidden" name="field" value="hidden" />
                      <input type="hidden" name="value" value={String(!prompt.hidden)} />
                      <button className="btn-ghost"><EyeOff className="h-4 w-4" /> Hide</button>
                    </form>
                    <form action={adminDeletePrompt}>
                      <input type="hidden" name="id" value={prompt.id} />
                      <button className="btn-ghost text-red-200"><Trash2 className="h-4 w-4" /> Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="panel rounded-lg p-6">
          <h2 className="text-xl font-bold">Users</h2>
          <div className="mt-4 grid gap-3">
            {((users ?? []) as Profile[]).map((user) => (
              <div key={user.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="font-semibold">{user.display_name ?? user.email}</p>
                <p className="text-sm text-slate-400">{user.email} | {user.role}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="panel rounded-lg p-6">
          <h2 className="text-xl font-bold">Reports</h2>
          <div className="mt-4 grid gap-3">
            {((reports ?? []) as ReportWithRelations[]).map((report) => (
              <div key={report.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="font-semibold">{report.prompts?.title ?? "Deleted prompt"}</p>
                <p className="text-sm text-slate-400">{report.reason}</p>
                <p className="mt-1 text-xs text-slate-500">By {report.users?.email} | {report.status}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.prompt_id && (
                    <form action={adminHideReportedPrompt}>
                      <input type="hidden" name="prompt_id" value={report.prompt_id} />
                      <input type="hidden" name="report_id" value={report.id} />
                      <button className="btn-ghost"><EyeOff className="h-4 w-4" /> Hide prompt</button>
                    </form>
                  )}
                  <form action={adminUpdateReport}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="status" value={report.status === "resolved" ? "open" : "resolved"} />
                    <button className="btn-ghost">{report.status === "resolved" ? "Reopen" : "Resolve"}</button>
                  </form>
                </div>
              </div>
            ))}
            {!reports?.length && <p className="text-slate-400">No reports yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
