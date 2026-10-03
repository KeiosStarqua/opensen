import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { StudioProvider } from "@/components/studio/studio-provider";
import { AppRoutes } from "@/lib/app-routes";
import { SIDEBAR_ACCOUNT_FALLBACK } from "@/lib/auth/sidebar-account-label";

import { AppShell } from "./app-shell";

const session = vi.hoisted(() => ({
  user: null as { name: string } | null,
}));

const route = vi.hoisted(() => ({ pathname: "/home" }));

vi.mock("@tanstack/react-router", () => ({
  useLocation: (options: { select: (location: { pathname: string }) => string }) =>
    options.select({ pathname: route.pathname }),
}));

vi.mock("@/components/app-link", () => ({
  AppLink: ({
    href,
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    useSession: () => ({ data: session.user ? { user: session.user } : null }),
  },
}));

function markup(accountName?: string | null) {
  return renderToStaticMarkup(
    <StudioProvider>
      <AppShell accountName={accountName}>
        <p>Lesson</p>
      </AppShell>
    </StudioProvider>,
  );
}

function profileControls(html: string) {
  return [...html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/g)]
    .map((match) => ({ attrs: match[1] ?? "", inner: match[2] ?? "" }))
    .filter((link) => link.attrs.includes(`href="${AppRoutes.profile}"`));
}

describe("AppShell account control", () => {
  it("shows the signed-in name and still opens the profile screen", () => {
    session.user = { name: "Lan Nguyen" };
    route.pathname = "/home";

    const html = markup("Someone Else");
    const controls = profileControls(html);

    expect(controls).toHaveLength(2);
    expect(html).toContain("Lan Nguyen");
    expect(html).not.toContain("Someone Else");
    expect(html).not.toContain(">Profile<");
    expect(html).not.toContain('aria-label="Profile"');
    for (const control of controls) {
      expect(control.attrs).toContain(`href="${AppRoutes.profile}"`);
    }
  });

  it("uses the fallback when the session name is blank", () => {
    session.user = { name: "   " };
    route.pathname = "/home";

    const html = markup("Lan Nguyen");
    const controls = profileControls(html);

    expect(html).toContain(SIDEBAR_ACCOUNT_FALLBACK);
    expect(html).not.toContain("Lan Nguyen");
    expect(controls).toHaveLength(2);
    expect(controls[0]?.inner).toContain(SIDEBAR_ACCOUNT_FALLBACK);
    expect(controls[1]?.attrs).toContain(`aria-label="${SIDEBAR_ACCOUNT_FALLBACK}"`);
  });

  it("uses the loaded account name until the session is in memory", () => {
    session.user = null;
    route.pathname = "/home";

    const html = markup("Lan Nguyen");

    expect(html).toContain("Lan Nguyen");
    expect(html).not.toContain(">Profile<");
    expect(profileControls(html)).toHaveLength(2);
  });

  it("uses the fallback when neither source has a name", () => {
    session.user = null;
    route.pathname = "/home";

    const html = markup(null);
    const controls = profileControls(html);

    expect(controls).toHaveLength(2);
    expect(controls[0]?.inner).toContain(SIDEBAR_ACCOUNT_FALLBACK);
    expect(controls[1]?.attrs).toContain(`aria-label="${SIDEBAR_ACCOUNT_FALLBACK}"`);
    expect(html).not.toContain('aria-label=""');
  });

  it("updates the label when the signed-in account changes", () => {
    route.pathname = "/home";
    session.user = { name: "Lan Nguyen" };
    const first = markup(null);
    session.user = { name: "Kai Tran" };
    const second = markup(null);

    expect(first).toContain("Lan Nguyen");
    expect(first).not.toContain("Kai Tran");
    expect(second).toContain("Kai Tran");
    expect(second).not.toContain("Lan Nguyen");
    for (const html of [first, second]) {
      for (const control of profileControls(html)) {
        expect(control.attrs).toContain(`href="${AppRoutes.profile}"`);
      }
    }
  });

  it("keeps the profile route when that screen is already open", () => {
    session.user = { name: "Lan Nguyen" };
    route.pathname = "/profile";

    const controls = profileControls(markup(null));

    expect(controls).toHaveLength(2);
    for (const control of controls) {
      expect(control.attrs).toContain('aria-current="page"');
      expect(control.attrs).toContain(`href="${AppRoutes.profile}"`);
    }
  });
});
