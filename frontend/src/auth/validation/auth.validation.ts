export const passwordRequirements = [
  { key: "minLength", test: (value: string) => value.length >= 12 },
  { key: "uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { key: "lowercase", test: (value: string) => /[a-z]/.test(value) },
  { key: "number", test: (value: string) => /\d/.test(value) },
  { key: "special", test: (value: string) => /[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>?]/.test(value) },
] as const;

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validatePassword(value: string) {
  return passwordRequirements.every(({ test }) => test(value));
}

export function getPasswordError(value: string) {
  const missing = passwordRequirements.filter(({ test }) => !test(value)).map(({ key }) => key);
  return missing.length ? missing : null;
}
