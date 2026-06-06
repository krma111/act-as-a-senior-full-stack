import Link from "next/link";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/prompts", label: "Prompts" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/settings", label: "Site Settings" },
  { href: "/admin/logs", label: "Logs" }
];

export function AdminTabs({ active }: { active: string }) {
  return (
    <nav className="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2" aria-label="Admin sections">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
            active === tab.label ? "bg-brand text-slate-950 shadow-glow" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
