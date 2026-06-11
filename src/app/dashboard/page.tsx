import { redirect } from "next/navigation";
import { getAuthSessionState } from "@/backend/auth/session";

export default async function DashboardRedirect() {
  const { profile } = await getAuthSessionState();
  if (profile?.role === "admin") redirect("/admin");
  redirect("/");
}
