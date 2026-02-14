import { UserRole } from "@prisma/client";

// Roles that can access the /admin section
export const STAFF_ROLES: UserRole[] = ["ADMIN", "OPERATOR"];

export function isStaffRole(role: string | undefined): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

export function isAdmin(role: string | undefined): boolean {
  return role === "ADMIN";
}

// Paths an OPERATOR can access under /admin
const OPERATOR_ALLOWED_PREFIXES = ["/admin/demand", "/admin/events"];

export function isOperatorAllowedPath(pathname: string): boolean {
  if (pathname === "/admin") return true;
  return OPERATOR_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
}
