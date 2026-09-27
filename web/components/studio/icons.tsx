import { BrandMark } from "@/components/brand-mark";

type IconProps = { className?: string };

function Stroke({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function LogoMark({ className }: IconProps) {
  return <BrandMark className={className} />;
}

export function HomeIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1v-9.5z" />
    </Stroke>
  );
}

export function LearnIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4 6.5h6.5A2.5 2.5 0 0 1 13 9v10.5H6.5A2.5 2.5 0 0 0 4 22V6.5z" />
      <path d="M20 6.5h-6.5A2.5 2.5 0 0 0 11 9v10.5h6.5A2.5 2.5 0 0 1 20 22V6.5z" />
    </Stroke>
  );
}

export function PracticeIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2" />
    </Stroke>
  );
}

export function ExploreIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="m14.8 9.2-1.3 4.3-4.3 1.3 1.3-4.3 4.3-1.3z" />
    </Stroke>
  );
}

export function LibraryIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M6 5.5h3.2v13H6a1.2 1.2 0 0 1-1.2-1.2v-10.6A1.2 1.2 0 0 1 6 5.5z" />
      <path d="M9.2 5.5H13v13H9.2z" />
      <path d="M13 7.2h4.2A1.3 1.3 0 0 1 18.5 8.5v9.8H13z" />
    </Stroke>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </Stroke>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M6 16.5h12l-1.2-2V10a4.8 4.8 0 0 0-9.6 0v4.5L6 16.5z" />
      <path d="M10 16.5a2 2 0 0 0 4 0" />
    </Stroke>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M14.5 6 8.5 12l6 6" />
    </Stroke>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="m9.5 6 6 6-6 6" />
    </Stroke>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Stroke>
  );
}

export function StarIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="m12 3.6 2.4 5.2 5.7.7-4.2 3.9 1.1 5.6L12 16.2 6.9 19l1.1-5.6L3.8 9.5l5.7-.7L12 3.6z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SpeakerIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M4 10h3.2L12 6.2v11.6L7.2 14H4v-4z" />
      <path d="M15.2 9.2a3.4 3.4 0 0 1 0 5.6M17.6 7a6 6 0 0 1 0 10" />
    </Stroke>
  );
}

export function MicIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <rect x="9" y="3.5" width="6" height="10" rx="3" />
      <path d="M7 11a5 5 0 0 0 10 0M12 16v4.5M9 20.5h6" />
    </Stroke>
  );
}

export function HeartIcon({ className, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 19.4s-6.6-4.1-6.6-8.2A3.5 3.5 0 0 1 12 8.6a3.5 3.5 0 0 1 6.6 2.6c0 4.1-6.6 8.2-6.6 8.2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.8s.4 3.2-1.4 5.2C9 9.8 8 11 8 13.2a4 4 0 0 0 8 0c0-1.4-.6-2.4-1.2-3.4.8 1.6.4 2.6.4 2.6s2.2-2.2 2.2-5.4C17.4 5.2 14.6 3.4 12 2.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CoinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8" fill="currentColor" />
      <path
        d="M12 8.2v7.6M9.6 10.1c.4-.8 1.2-1.2 2.4-1.2 1.4 0 2.3.6 2.3 1.7 0 2.4-4.7 1.2-4.7 3.3 0 1 .9 1.7 2.4 1.7 1.2 0 2.1-.5 2.5-1.3"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function SentencesIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="4" y="3.5" width="12" height="16" rx="2" fill="currentColor" />
      <path d="M8 8h5M8 11.5h6M8 15h4" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function PlaneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M3 13.2 21 7.2l-2.2 9.2-5.2-2.2-2.4 3.6-1.2-4.2L3 13.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BowlIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M5 10h14c-.4 5-3 8-7 8s-6.6-3-7-8z" fill="currentColor" />
      <path d="M8 7.2c.4-1.6 1.2-2.4 2-2.4M12 6.2c.3-1.4 1-2.2 1.8-2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 8.5h10l-.8 10.2a1.5 1.5 0 0 1-1.5 1.3H9.3a1.5 1.5 0 0 1-1.5-1.3L7 8.5z" fill="currentColor" />
      <path d="M9 8.5V7.2A3 3 0 0 1 12 4a3 3 0 0 1 3 3.2v1.3" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function HouseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 11.2 12 5l8 6.2V19a1 1 0 0 1-1 1h-5.2v-5.2H10.2V20H5a1 1 0 0 1-1-1v-7.8z" fill="currentColor" />
    </svg>
  );
}

export function SchoolIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="m3 10 9-5 9 5-9 5-9-5z" fill="currentColor" />
      <path d="M7 12.2V16c1.6 1.4 3.2 2 5 2s3.4-.6 5-2v-3.8" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

export function TopicGlyph({
  name,
  className,
}: {
  name: "plane" | "bowl" | "bag" | "house" | "school";
  className?: string;
}) {
  if (name === "plane") return <PlaneIcon className={className} />;
  if (name === "bowl") return <BowlIcon className={className} />;
  if (name === "bag") return <BagIcon className={className} />;
  if (name === "house") return <HouseIcon className={className} />;
  return <SchoolIcon className={className} />;
}

export function LightbulbIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="M9 18h6M10 21h4" />
      <path d="M8 14.2A5.2 5.2 0 1 1 16.2 10c0 2-1.2 3.2-2.2 4.2-.6.6-1 1.4-1 2.2h-2c0-.8-.4-1.6-1-2.2-1-1-2-2.2-2-4z" />
    </Stroke>
  );
}

export function TurtleIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <ellipse cx="13" cy="13" rx="5" ry="3.6" />
      <circle cx="7.2" cy="13" r="1.6" />
      <path d="M10 10.2 8.6 8M13 9.4V7.2M16 10.4l1.4-2" />
    </Stroke>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <path d="m5 12.5 4.2 4.2L19 7.5" />
    </Stroke>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <Stroke className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
    </Stroke>
  );
}
