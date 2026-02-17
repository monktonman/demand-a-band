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
const OPERATOR_ALLOWED_PREFIXES = ["/admin/events", "/admin/venues"];

export function isOperatorAllowedPath(pathname: string): boolean {
  if (pathname === "/admin") return true;
  return OPERATOR_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));
}

// Check if a session user has access to a specific venue
// Admins always have access; operators only if assigned
export function isOperatorForVenue(
  session: { user: { role: string; operatorVenueIds?: string[] } },
  venueId: string
): boolean {
  if (session.user.role === "ADMIN") return true;
  return session.user.operatorVenueIds?.includes(venueId) ?? false;
}

// Get venue IDs for scoping queries
// Returns undefined for admin (no filter needed), or the operator's venue IDs
export function getOperatorVenueFilter(
  session: { user: { role: string; operatorVenueIds?: string[] } }
): string[] | undefined {
  if (session.user.role === "ADMIN") return undefined;
  return session.user.operatorVenueIds ?? [];
}
