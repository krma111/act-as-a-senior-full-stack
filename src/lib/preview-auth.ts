import { cookies } from "next/headers";
import { adminEmail, isPreviewMode } from "@/lib/env";

export type PreviewUser = {
  id: string;
  email: string;
  display_name: string;
  role: "user" | "admin";
};

const cookieName = "prompthub_preview_user";

export async function getPreviewUser() {
  if (!isPreviewMode) return null;

  const cookieStore = await cookies();
  const raw = cookieStore.get(cookieName)?.value;
  if (!raw) return null;

  const parts = raw.split("|").map((part) => decodeURIComponent(part));
  if (parts.length !== 4) return null;
  const [id, email, displayName, role] = parts;
  if (!id || !email || (role !== "user" && role !== "admin")) return null;
  return { id, email, display_name: displayName || email.split("@")[0], role };
}

export async function setPreviewUser(email: string, displayName?: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user: PreviewUser = {
    id: "preview-user",
    email: normalizedEmail,
    display_name: displayName?.trim() || normalizedEmail.split("@")[0] || "Preview creator",
    role: normalizedEmail === adminEmail ? "admin" : "user"
  };

  const cookieStore = await cookies();
  cookieStore.set(cookieName, [user.id, user.email, user.display_name, user.role].map(encodeURIComponent).join("|"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearPreviewUser() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}
