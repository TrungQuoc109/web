import type { MemberRole } from "@/shared/types/workspace";

export function canManageProject(role?: string | null) {
  return role === "OWNER" || role === "ADMIN";
}

export function canTransferProjectOwnership(role?: string | null) {
  return role === "OWNER";
}

export function canManageProjectMembers(role?: string | null) {
  return canManageProject(role);
}

export function canSendProjectMessages(role?: string | null) {
  return Boolean(role) && role !== "VIEWER";
}

export function canSendProjectAnnouncements(role?: string | null) {
  return role === "OWNER" || role === "ADMIN";
}

export function isElevatedProjectRole(role?: string | null): role is MemberRole {
  return role === "OWNER" || role === "ADMIN";
}
