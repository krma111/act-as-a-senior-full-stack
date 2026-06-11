"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/packs", label: "Prompt Packs" },
  { href: "/admin/payments", label: "Orders" },
  { href: "/admin/settings", label: "Site Settings" }
];

export function AdminTabs({ active }: { active: string }) {
  return (
    <motion.nav
      className="premium-scrollbar mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.055] p-2 shadow-[0_22px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl"
      aria-label="Admin sections"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {tabs.map((tab) => (
        <motion.div key={tab.href} className="shrink-0" whileHover={{ y: -1, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            href={tab.href}
            className={`relative block overflow-hidden rounded-xl px-4 py-2 text-sm font-bold transition ${
              active === tab.label ? "bg-brand text-slate-950 shadow-glow" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        </motion.div>
      ))}
    </motion.nav>
  );
}
