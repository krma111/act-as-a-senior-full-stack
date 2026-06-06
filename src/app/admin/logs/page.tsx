import { AdminTabs } from "@/components/admin-tabs";
import { getAdminLogs } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AdminLogsPage() {
  const { logs, error } = await getAdminLogs();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminTabs active="Logs" />
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Admin console</p>
        <h1 className="mt-2 text-3xl font-black text-white">Admin logs</h1>
        <p className="mt-2 text-sm text-slate-400">Latest recorded admin actions.</p>
      </div>
      {error ? <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div> : null}
      {!logs.length ? (
        <section className="card-surface rounded-[28px] p-10 text-center"><p className="text-xl font-bold text-white">No admin logs yet.</p></section>
      ) : (
        <section className="grid gap-3">
          {logs.map((log) => (
            <article key={log.id} className="card-surface rounded-2xl p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-white">{log.action_type}</p>
                  <p className="text-sm text-slate-400">{log.target_table} / {log.target_id ?? "unknown"}</p>
                </div>
                <p className="text-sm text-slate-400">{log.admin_email ?? "Admin"} - {formatDate(log.created_at)}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
