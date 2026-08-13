export type StaffRole = "admin" | "garcom" | "cozinha";

const env = import.meta.env as Record<string, string | undefined>;

const ROLE_PASSWORDS: Record<StaffRole, string> = {
  admin: env.NEXT_PUBLIC_ADMIN_PASSWORD ?? env.VITE_ADMIN_PASSWORD ?? "admin123",
  garcom: env.NEXT_PUBLIC_GARCOM_PASSWORD ?? env.VITE_GARCOM_PASSWORD ?? "garcom123",
  cozinha: env.NEXT_PUBLIC_COZINHA_PASSWORD ?? env.VITE_COZINHA_PASSWORD ?? "cozinha123",
};

function accessKey(role: StaffRole) {
  return `churraspao-access-${role}`;
}

export function isAccessGranted(role: StaffRole) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(accessKey(role)) === "ok";
}

export function grantAccess(role: StaffRole, password: string) {
  if (password.trim() !== ROLE_PASSWORDS[role]) return false;
  localStorage.setItem(accessKey(role), "ok");
  return true;
}

export function clearAccess(role: StaffRole) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(accessKey(role));
}
