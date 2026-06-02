export const minimumPasswordLength = 8;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return false;
  if (email.includes("..")) return false;

  const [localPart, domain] = email.split("@");
  if (!localPart || !domain || email.split("@").length !== 2) return false;
  if (localPart.length > 64 || domain.length > 253) return false;
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(localPart)) return false;

  const labels = domain.split(".");
  if (labels.length < 2) return false;
  if (!/^[a-z]{2,}$/i.test(labels[labels.length - 1] ?? "")) return false;

  return labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label));
}

export function getEmailValidationError(value: string) {
  return isValidEmail(value) ? null : "Invalid email";
}

export function getPasswordValidationError(value: string) {
  return value.length >= minimumPasswordLength ? null : "Password must be at least 8 characters.";
}
