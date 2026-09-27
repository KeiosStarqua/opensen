"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { flushSync } from "react-dom";

import { AppRoutes, shellTabRoutes } from "@/lib/app-routes";

import {
  ExploreIcon,
  HomeIcon,
  LearnIcon,
  LibraryIcon,
  LogoMark,
  PracticeIcon,
} from "./studio/icons";
import { ProfileAvatar } from "./studio/mascot";
import { useStudio } from "./studio/studio-provider";

const icons = {
  [AppRoutes.home]: HomeIcon,
  [AppRoutes.learn]: LearnIcon,
  [AppRoutes.practice]: PracticeIcon,
  [AppRoutes.explore]: ExploreIcon,
  [AppRoutes.library]: LibraryIcon,
} as const;

function isActive(pathname: string, href: string) {
  if (href === AppRoutes.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { resetPracticeDeck } = useStudio();
  const profileActive = pathname === AppRoutes.profile;

  return (
    <div className="flex h-full min-h-0 gap-3 bg-sen-canvas p-3 text-sen-ink md:p-4">
      <aside className="hidden w-[228px] shrink-0 flex-col rounded-[28px] bg-white px-3 py-4 shadow-[0_10px_30px_rgba(40,80,50,0.06)] md:flex">
        <Link href={AppRoutes.home} className="flex items-center gap-2.5 px-2 pb-5">
          <LogoMark className="h-9 w-9" />
          <span className="text-lg font-extrabold text-[#1d7a45]">OpenSen</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Primary">
          {shellTabRoutes.map((tab) => {
            const Icon = icons[tab.href];
            const active = isActive(pathname, tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                onClick={
                  tab.href === AppRoutes.practice
                    ? () => {
                        flushSync(() => resetPracticeDeck());
                      }
                    : undefined
                }
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold transition ${
                  active
                    ? "bg-sen-soft text-sen-primary"
                    : "text-[#5e6f66] hover:bg-[#f4f8f5]"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href={AppRoutes.profile}
          aria-current={profileActive ? "page" : undefined}
          className={`mt-4 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold ${
            profileActive ? "bg-sen-soft text-sen-primary" : "text-[#5e6f66] hover:bg-[#f4f8f5]"
          }`}
        >
          <ProfileAvatar className="h-9 w-9" />
          Profile
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between md:hidden">
          <Link href={AppRoutes.home} className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <span className="font-extrabold text-[#1d7a45]">OpenSen</span>
          </Link>
        </div>
        <main className="min-h-0 flex-1 overflow-auto pb-24 md:pb-1">{children}</main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-20 flex justify-around rounded-2xl bg-white px-1 py-2 shadow-lg md:hidden"
        aria-label="Primary"
      >
        {shellTabRoutes.map((tab) => {
          const Icon = icons[tab.href];
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              onClick={
                tab.href === AppRoutes.practice
                  ? () => {
                      flushSync(() => resetPracticeDeck());
                    }
                  : undefined
              }
              className={`grid h-11 w-11 place-items-center rounded-xl ${
                active ? "bg-sen-soft text-sen-primary" : "text-[#5e6f66]"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
        <Link
          href={AppRoutes.profile}
          aria-label="Profile"
          aria-current={profileActive ? "page" : undefined}
          className={`grid h-11 w-11 place-items-center rounded-xl ${
            profileActive ? "bg-sen-soft text-sen-primary" : "text-[#5e6f66]"
          }`}
        >
          <ProfileAvatar className="h-7 w-7" />
        </Link>
      </nav>
    </div>
  );
}
