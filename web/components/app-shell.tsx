"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppRoutes, shellTabRoutes } from "@/lib/app-routes";
import { siteConfig } from "@/lib/site";

function isTabActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabNavLink({
  href,
  label,
  pathname,
  className,
}: {
  href: string;
  label: string;
  pathname: string;
  className?: string;
}) {
  const active = isTabActive(pathname, href);
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-emerald-100 text-emerald-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      } ${className ?? ""}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col bg-[#f8f6f2] text-slate-900 md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200/80 bg-white/60 md:flex">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4">
          <p className="text-sm font-semibold">{siteConfig.name}</p>
          <Link
            href={AppRoutes.settings}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary">
          {shellTabRoutes.map((tab) => (
            <TabNavLink
              key={tab.href}
              href={tab.href}
              label={tab.label}
              pathname={pathname}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-[#f8f6f2]/90 px-4 py-3 backdrop-blur md:hidden">
          <p className="text-sm font-semibold">{siteConfig.name}</p>
          <Link
            href={AppRoutes.settings}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Settings"
          >
            <SettingsIcon />
          </Link>
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>

        <nav
          className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-slate-200/80 bg-white/95 px-2 py-2 backdrop-blur md:hidden"
          aria-label="Primary"
        >
          {shellTabRoutes.map((tab) => (
            <TabNavLink
              key={tab.href}
              href={tab.href}
              label={tab.label}
              pathname={pathname}
              className="flex flex-1 flex-col items-center px-1 py-1.5 text-xs"
            />
          ))}
        </nav>
      </div>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
      />
    </svg>
  );
}
