"use client";

import Link from "next/link";
import { useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { siteConfig } from "@/lib/site";

const links = [
  { href: "#top", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#for-kids", label: "For Kids" },
  { href: "#pricing", label: "Pricing" },
  { href: "#stories", label: "Stories" },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4eee6]/80 bg-[#f6f3ea]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-4 sm:px-5 sm:py-3.5 lg:px-8">
        <a href="#top" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="truncate text-base font-extrabold tracking-tight text-[#173028] sm:text-lg">
            {siteConfig.name}
          </span>
        </a>

        <nav className="ml-6 hidden items-center gap-7 text-sm font-bold text-[#3e5248] md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[#173028]">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-[#d7e3da] bg-white px-2.5 py-1.5 text-xs font-extrabold text-[#173028] sm:gap-1.5 sm:px-3"
              aria-expanded={langOpen}
              aria-haspopup="listbox"
              onClick={() => setLangOpen((open) => !open)}
            >
              EN
              <Chevron className="h-3 w-3" />
            </button>
            {langOpen ? (
              <ul
                role="listbox"
                aria-label="Language"
                className="absolute right-0 mt-2 w-36 rounded-2xl border border-[#e4eee6] bg-white p-1.5 text-sm shadow-lg"
              >
                <li>
                  <button
                    type="button"
                    role="option"
                    aria-selected="true"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 font-bold text-[#173028]"
                    onClick={() => setLangOpen(false)}
                  >
                    English
                    <span className="text-[#1c8f4e]" aria-hidden>
                      ✓
                    </span>
                  </button>
                </li>
              </ul>
            ) : null}
          </div>

          <Link
            href={siteConfig.trialHref}
            className="inline-flex items-center rounded-full bg-[#178a45] px-3 py-1.5 text-xs font-extrabold text-white hover:bg-[#12753a] sm:px-4 sm:py-2 sm:text-sm"
          >
            Get started
            <span aria-hidden className="ml-1.5">
              →
            </span>
          </Link>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d7e3da] bg-white sm:h-10 sm:w-10 md:hidden"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="flex flex-col gap-1" aria-hidden>
              <span className="block h-0.5 w-4 bg-[#173028]" />
              <span className="block h-0.5 w-4 bg-[#173028]" />
              <span className="block h-0.5 w-4 bg-[#173028]" />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-[#e4eee6] px-5 py-3 md:hidden">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block py-2.5 text-sm font-bold text-[#3e5248]"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden>
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
