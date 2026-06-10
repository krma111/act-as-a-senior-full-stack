import { Crown } from "lucide-react";
import { resolveCreatorBadge } from "@/backend/creators/badges";
import type { Profile } from "@/shared/types";

const badgeClasses = {
  none: "border-white/10 bg-white/[0.04] text-slate-400",
  bronze: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  silver: "border-slate-200/30 bg-slate-200/10 text-slate-100",
  gold: "border-yellow-300/40 bg-yellow-300/10 text-yellow-100",
  diamond: "badge-diamond border-cyan-200/40 bg-cyan-200/10 text-cyan-100"
};

export function CreatorBadge({
  profile,
  compact = false,
  hideEmpty = true
}: {
  profile?: Pick<Profile, "manual_badge_override" | "manual_badge_type" | "copy_total"> | null;
  compact?: boolean;
  hideEmpty?: boolean;
}) {
  const badge = resolveCreatorBadge(profile);

  if (badge.type === "none" && hideEmpty) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClasses[badge.type]}`}
      title={badge.label}
    >
      <Crown className="h-3.5 w-3.5" />
      {compact ? badge.shortLabel : badge.label}
    </span>
  );
}
