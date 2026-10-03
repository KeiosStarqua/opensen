import { AppRoutes } from "@/lib/app-routes";

/** Only same-origin relative paths. Anything else falls back to home. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return AppRoutes.home;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return AppRoutes.home;
  }
  return value;
}
