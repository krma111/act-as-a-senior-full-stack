export function getAuthErrorMessage(error: { message?: string } | string | null | undefined) {
  const message = typeof error === "string" ? error : error?.message;
  if (!message) return "Something went wrong. Please try again.";

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) return "Incorrect email or password.";
  if (normalized.includes("email not confirmed")) return "Verify your email before signing in.";
  if (normalized.includes("user already registered")) return "An account with this email already exists.";
  if (normalized.includes("unable to validate email address")) return "Enter a valid email address.";
  if (normalized.includes("email address is invalid")) return "Enter a valid email address.";
  if (normalized.includes("password should be at least")) return "Password must be at least 8 characters.";
  if (normalized.includes("same_password")) return "Choose a new password that is different from the current one.";
  if (normalized.includes("expired")) return "This link has expired. Request a new one.";
  if (normalized.includes("otp")) return "This sign-in or recovery link is invalid. Request a new one.";
  if (normalized.includes("provider is not enabled")) return "This sign-in method is not enabled yet.";
  if (normalized.includes("email rate limit")) return "Too many email requests. Please wait and try again.";
  if (normalized.includes("for security purposes")) return "Please wait a moment before trying again.";

  return message;
}
