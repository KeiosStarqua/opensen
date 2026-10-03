import { siteConfig } from "@/lib/site";

export const defaultTitle = "OpenSen — Real sentences for real life";

/** `<title>` for a route, matching the old Next.js template `%s · OpenSen`. */
export function pageTitle(title: string): { title: string } {
  return { title: `${title} · ${siteConfig.name}` };
}
