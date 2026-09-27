import type { StudioStep } from "@/lib/studio/content";

import { MascotGlyph } from "./mascot";

function SkyDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#bfe9fb" />
        <stop offset="55%" stopColor="#e7f7ee" />
        <stop offset="100%" stopColor="#b7e4c6" />
      </linearGradient>
      <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8fd0b4" />
        <stop offset="100%" stopColor="#5eae86" />
      </linearGradient>
    </defs>
  );
}

export function HomeLandscape() {
  return (
    <svg viewBox="0 0 1200 300" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <SkyDefs id="home" />
      <rect width="1200" height="300" fill="url(#home-sky)" />
      <ellipse cx="180" cy="48" rx="50" ry="16" fill="white" opacity="0.9" />
      <ellipse cx="220" cy="54" rx="32" ry="12" fill="white" />
      <ellipse cx="860" cy="42" rx="44" ry="14" fill="white" opacity="0.8" />
      <path d="M0 168 140 110 240 150 360 88 500 150 640 96 780 150 940 100 1100 148 1200 120 1200 300 0 300Z" fill="#c5e4da" />
      <path d="M0 200 160 150 280 186 420 140 580 186 740 150 920 190 1200 156 1200 300 0 300Z" fill="url(#home-hill)" />
      <g transform="translate(780 118) scale(0.85)">
        <rect x="-16" y="22" width="32" height="42" rx="2" fill="#f4e3c4" />
        <path d="M-36 24 0 -4 36 24Z" fill="#e15d52" />
        <path d="M-42 8 0 -26 42 8Z" fill="#d4534a" />
        <rect x="-3" y="-42" width="6" height="18" fill="#e6c15a" />
      </g>
      <g transform="translate(640 150)">
        <rect x="0" y="14" width="7" height="24" rx="2" fill="#8a5a3a" />
        <circle cx="3" cy="8" r="16" fill="#3aaa5c" />
        <circle cx="-6" cy="16" r="11" fill="#2e9450" />
      </g>
      <g transform="translate(980 158)">
        <rect x="0" y="8" width="7" height="26" rx="2" fill="#8a5a3a" />
        <circle cx="4" cy="4" r="18" fill="#2f9a55" />
      </g>
      <ellipse cx="250" cy="248" rx="150" ry="28" fill="#7ec8e3" />
      <ellipse cx="250" cy="244" rx="110" ry="14" fill="#b7e6f4" opacity="0.8" />
      <ellipse cx="210" cy="246" rx="42" ry="12" fill="#3eae62" />
      <ellipse cx="330" cy="256" rx="28" ry="9" fill="#349656" />
      <circle cx="188" cy="232" r="6" fill="#f7a8c4" />
      <circle cx="204" cy="226" r="4" fill="#ffe08a" />
      <g transform="translate(214 168) scale(0.72)">
        <MascotGlyph />
      </g>
    </svg>
  );
}

export function AirportScene() {
  return (
    <svg viewBox="0 0 1100 360" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="air-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c5ecfb" />
          <stop offset="70%" stopColor="#e9f8ef" />
          <stop offset="100%" stopColor="#d7f0c8" />
        </linearGradient>
      </defs>
      <rect width="1100" height="360" fill="url(#air-sky)" />
      <ellipse cx="180" cy="70" rx="70" ry="22" fill="white" opacity="0.9" />
      <ellipse cx="230" cy="78" rx="40" ry="16" fill="white" />
      <ellipse cx="760" cy="90" rx="56" ry="18" fill="white" opacity="0.85" />
      <g transform="translate(560 132) scale(0.92)">
        <ellipse cx="70" cy="8" rx="92" ry="22" fill="white" />
        <path d="M40 6 10 36 46 14Z" fill="#d5e4f4" />
        <path d="M78 -2 130 -42 96 6Z" fill="#f7fbff" />
        <path d="M150 2 188 10 150 18Z" fill="#3d7ec4" />
        <rect x="20" y="-2" width="10" height="8" rx="1" fill="#8ec6ea" />
        <rect x="40" y="-2" width="10" height="8" rx="1" fill="#8ec6ea" />
        <rect x="60" y="-2" width="10" height="8" rx="1" fill="#8ec6ea" />
        <path d="M8 10 40 18 8 28Z" fill="#3d7ec4" />
      </g>
      <rect x="80" y="210" width="520" height="90" rx="16" fill="#f7fbff" />
      <rect x="110" y="228" width="70" height="46" rx="6" fill="#b9ddf5" />
      <rect x="200" y="228" width="70" height="46" rx="6" fill="#d5ebf8" />
      <rect x="290" y="228" width="120" height="46" rx="6" fill="#9fd0ee" />
      <rect x="430" y="228" width="70" height="46" rx="6" fill="#d5ebf8" />
      <rect x="250" y="176" width="160" height="36" rx="8" fill="#5aa0d6" />
      <g transform="translate(760 150)">
        <rect x="-16" y="40" width="32" height="110" rx="4" fill="#f7fbff" />
        <rect x="-36" y="28" width="72" height="28" rx="6" fill="#5aa0d6" />
        <path d="M0 -10 -22 28h44Z" fill="#3d7ec4" />
        <rect x="-4" y="-28" width="8" height="20" fill="#e6c15a" />
      </g>
      <path d="M0 268c120 18 220 8 340-8 140-18 260-6 400 10 120 14 220 4 360-8v98H0Z" fill="#b7e38a" />
      <path d="M0 300c140 14 260 0 400-6 160-8 280 10 420 8 100-2 180-12 280-6v64H0Z" fill="#8ed06a" />
      <g transform="translate(150 214) scale(0.78)">
        <MascotGlyph accessory="backpack" />
      </g>
    </svg>
  );
}

export function CheckInScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 460" className={className ?? "h-full w-full"} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="520" height="460" fill="#e7f6fb" />
      <rect x="36" y="28" width="300" height="200" rx="28" fill="#bfe6f6" />
      <ellipse cx="120" cy="90" rx="36" ry="14" fill="white" />
      <ellipse cx="250" cy="70" rx="28" ry="12" fill="white" opacity="0.8" />
      <rect x="0" y="250" width="520" height="210" fill="#f7f1e6" />
      <rect x="70" y="250" width="300" height="18" rx="4" fill="#e4d3b8" />
      <rect x="90" y="268" width="250" height="120" rx="12" fill="#fffaf3" />
      <rect x="248" y="300" width="108" height="42" rx="8" fill="#d7ebf8" />
      <text x="262" y="327" fill="#3d7ec4" fontSize="16" fontWeight="700" fontFamily="Nunito, sans-serif">
        Check-in
      </text>
      <g transform="translate(372 286)">
        <ellipse cx="0" cy="78" rx="36" ry="10" fill="#000" opacity="0.06" />
        <path d="M-34 18c0-8 10-16 34-16s34 8 34 16v62c0 8-14 14-34 14s-34-6-34-14V18z" fill="#243e73" />
        <path d="M-8 16h16l6 28H-14z" fill="#f2c14e" />
        <circle cx="0" cy="-8" r="24" fill="#f3c7a8" />
        <path d="M-22 -12c3-20 12-28 22-28s19 8 22 28c-7-7-14-10-22-10s-15 3-22 10z" fill="#3a2a24" />
        <circle cx="-8" cy="-6" r="2.2" fill="#24302a" />
        <circle cx="8" cy="-6" r="2.2" fill="#24302a" />
        <path d="M-7 4 Q0 10 8 4" stroke="#24302a" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <ellipse cx="-16" cy="6" rx="5" ry="3" fill="#f4b2a8" />
        <ellipse cx="16" cy="6" rx="5" ry="3" fill="#f4b2a8" />
      </g>
      <g transform="translate(168 318)">
        <ellipse cx="0" cy="62" rx="30" ry="8" fill="#000" opacity="0.06" />
        <rect x="-40" y="6" width="24" height="34" rx="8" fill="#2f9a55" />
        <path d="M-22 16c2-10 10-16 22-16s20 6 22 16v40c0 10-10 16-22 16s-22-6-22-16V16z" fill="#f4a03a" />
        <circle cx="0" cy="-16" r="20" fill="#f3c7a8" />
        <path d="M-16 -18c2-14 8-20 16-20s14 6 16 20c-5-5-10-7-16-7s-11 2-16 7z" fill="#6b3e22" />
        <circle cx="-6" cy="-14" r="2" fill="#24302a" />
        <circle cx="6" cy="-14" r="2" fill="#24302a" />
        <path d="M-5 -6 Q0 0 6 -6" stroke="#24302a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <rect x="26" y="8" width="26" height="32" rx="3" fill="#1f4f86" />
        <rect x="30" y="12" width="18" height="10" rx="1.5" fill="#f6d36b" />
      </g>
    </svg>
  );
}

const artFill: Record<StudioStep["art"], [string, string]> = {
  counter: ["#d7f0fb", "#9fd0ee"],
  help: ["#e5f8ea", "#8ed0a4"],
  bag: ["#fff1df", "#f3c48a"],
  security: ["#e7eeff", "#b7c7f5"],
  gate: ["#e5f6fb", "#7ec4ea"],
  table: ["#fff4e8", "#f0c49a"],
  menu: ["#fde8f0", "#f3b0c8"],
  pay: ["#e7f8ec", "#9ed6ae"],
  shop: ["#fde8f0", "#f0b4cc"],
  town: ["#e7f6fb", "#a9d7ef"],
  class: ["#e8f0ff", "#c5d4f8"],
};

export function StepArt({ art }: { art: StudioStep["art"] }) {
  const [from, to] = artFill[art];
  return (
    <svg viewBox="0 0 220 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="220" height="90" fill={from} />
      <circle cx="180" cy="20" r="16" fill="white" opacity="0.7" />
      <rect x="16" y="48" width="120" height="28" rx="8" fill={to} />
      <circle cx="168" cy="58" r="16" fill="#fff9f2" />
      <path d="M160 52c2-8 6-10 8-10s6 2 8 10c-3-3-6-4-8-4s-5 1-8 4z" fill="#2f9e56" />
    </svg>
  );
}

export function CelebrateScene() {
  return (
    <svg viewBox="0 0 280 200" className="mx-auto h-44 w-full" aria-hidden>
      <circle cx="140" cy="108" r="78" fill="#e7f8ec" />
      <path d="M46 48 58 70" stroke="#f0b429" strokeWidth="4" strokeLinecap="round" />
      <path d="M226 42 214 66" stroke="#f08c2a" strokeWidth="4" strokeLinecap="round" />
      <path d="M70 150 48 162" stroke="#1f9d52" strokeWidth="4" strokeLinecap="round" />
      <path d="M214 150 236 164" stroke="#3d93e8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="78" cy="70" r="6" fill="#f7c948" />
      <circle cx="210" cy="86" r="5" fill="#ef5b6c" />
      <circle cx="196" cy="150" r="4" fill="#3d93e8" />
      <g transform="translate(140 108)">
        <MascotGlyph accessory="cheer" />
      </g>
    </svg>
  );
}

export function SpeakScene() {
  return (
    <svg viewBox="0 0 280 180" className="mx-auto h-36 w-full" aria-hidden>
      <ellipse cx="140" cy="150" rx="90" ry="16" fill="#d9f3df" />
      <g transform="translate(140 96) scale(0.86)">
        <MascotGlyph accessory="wave" />
      </g>
    </svg>
  );
}
