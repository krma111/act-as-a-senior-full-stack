import type { Profile } from "@/shared/types";

export type CreatorBadgeType = "none" | "bronze" | "silver" | "gold" | "diamond";

export type CreatorBadge = {
  type: CreatorBadgeType;
  label: string;
  shortLabel: string;
};

export const creatorBadges: Record<CreatorBadgeType, CreatorBadge> = {
  none: { type: "none", label: "No Crown", shortLabel: "No Crown" },
  bronze: { type: "bronze", label: "Bronze Crown", shortLabel: "Bronze" },
  silver: { type: "silver", label: "Silver Crown", shortLabel: "Silver" },
  gold: { type: "gold", label: "Gold Crown", shortLabel: "Gold" },
  diamond: { type: "diamond", label: "Diamond Crown", shortLabel: "Diamond" }
};

export function badgeFromCopyTotal(copyTotal = 0): CreatorBadgeType {
  if (copyTotal >= 401) return "diamond";
  if (copyTotal >= 101) return "gold";
  if (copyTotal >= 21) return "silver";
  if (copyTotal >= 10) return "bronze";
  return "none";
}

export function normalizeBadgeType(value?: string | null): CreatorBadgeType {
  if (value === "bronze" || value === "silver" || value === "gold" || value === "diamond") return value;
  return "none";
}

export function resolveCreatorBadge(profile?: Pick<Profile, "manual_badge_override" | "manual_badge_type" | "copy_total"> | null) {
  const type = profile?.manual_badge_override
    ? normalizeBadgeType(profile.manual_badge_type)
    : badgeFromCopyTotal(profile?.copy_total ?? 0);

  return creatorBadges[type];
}
