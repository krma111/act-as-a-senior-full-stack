import { cookies } from "next/headers";

export type PreviewUser = {
  id: string;
  email: string;
  display_name: string;
  role: "user" | "admin";
};

const cookieName = "promptvault_preview_user";

export async function getPreviewUser(): Promise<PreviewUser | null> {
  return null;
}

export async function setPreviewUser(_email: string, _displayName?: string) {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function clearPreviewUser() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}
