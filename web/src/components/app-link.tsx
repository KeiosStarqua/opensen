import { Link } from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  /** Same-origin path with optional `?query` and `#hash`, or an external URL. */
  href: string;
};

function isInAppHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/**
 * Router link for the string hrefs built by `AppRoutes` (which mirror the
 * mobile app). In-app paths navigate client-side through TanStack Router and
 * preload on intent; hash-only and external hrefs render a plain anchor.
 */
export function AppLink({ href, children, ...anchorProps }: AppLinkProps) {
  if (!isInAppHref(href)) {
    return (
      <a href={href} {...anchorProps}>
        {children}
      </a>
    );
  }
  // `href` (path + query + hash) takes precedence over `to` when the router
  // builds the location; `to` is only here to satisfy the typed props.
  return (
    <Link to="." href={href} {...anchorProps}>
      {children}
    </Link>
  );
}
