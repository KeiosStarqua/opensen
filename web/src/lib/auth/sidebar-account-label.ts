/** Shown when the signed-in account has no display name. */
export const SIDEBAR_ACCOUNT_FALLBACK = "Account";

/**
 * Label for the study-shell account control. A present name replaces the
 * fixed word "Profile"; a missing or blank name stays a short fallback so
 * the control is never empty.
 */
export function sidebarAccountLabel(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : SIDEBAR_ACCOUNT_FALLBACK;
}
