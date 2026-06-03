import { getAuthErrorMessage } from "@/lib/auth/errors";

export function getClientAuthErrorMessage(error: unknown, fallback: string) {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : fallback;

  if (
    rawMessage.includes("Missing required environment variable") ||
    rawMessage.includes("NEXT_PUBLIC_SUPABASE")
  ) {
    return "Supabase is not configured";
  }

  return getAuthErrorMessage(rawMessage || fallback);
}
