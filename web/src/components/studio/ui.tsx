import { AppLink } from "@/components/app-link";

import { ChevronLeftIcon, HeartIcon, SearchIcon, StarIcon } from "./icons";

export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  className = "",
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{label}</span>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sen-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-white bg-white pl-10 pr-4 text-sm font-semibold text-sen-ink shadow-sm outline-none ring-sen-primary placeholder:text-sen-muted focus:ring-2"
      />
    </label>
  );
}

export function BackButton({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <AppLink
      href={href}
      aria-label={label}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-sen-ink shadow-sm hover:bg-sen-soft"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </AppLink>
  );
}

export function Stars({ value = 0, max = 3 }: { value?: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-[#d5ddd6]" aria-hidden>
      {Array.from({ length: max }, (_, index) => (
        <StarIcon
          key={index}
          filled={index < value}
          className={`h-4 w-4 ${index < value ? "text-sen-gold" : ""}`}
        />
      ))}
    </span>
  );
}

export function HeartRow({ hearts }: { hearts: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${hearts} hearts left`}>
      {Array.from({ length: 3 }, (_, index) => (
        <HeartIcon
          key={index}
          filled={index < hearts}
          className={`h-5 w-5 ${index < hearts ? "text-sen-heart" : "text-[#e4d5d8]"}`}
        />
      ))}
    </span>
  );
}

export function Fraction({ current, total }: { current: number; total: number }) {
  return (
    <span className="text-sm font-extrabold text-sen-primary">
      {current} / {total}
    </span>
  );
}

export function Track({ value }: { value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#e5eee7]" aria-hidden>
      <div className="h-full rounded-full bg-sen-primary" style={{ width }} />
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const classes = `inline-flex h-12 items-center justify-center rounded-full bg-sen-primary px-6 text-sm font-extrabold text-white shadow-[0_8px_16px_rgba(31,157,82,0.28)] transition hover:bg-sen-primary-dark disabled:cursor-not-allowed disabled:bg-[#b7d7c4] disabled:shadow-none ${className}`;
  if (href) {
    return (
      <AppLink href={href} className={classes}>
        {children}
      </AppLink>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function PracticeHeader({
  backHref,
  current,
  total,
  hearts,
}: {
  backHref: string;
  current: number;
  total: number;
  hearts: number;
}) {
  const width = total === 0 ? 0 : (current / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <BackButton href={backHref} />
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-sen-primary" style={{ width: `${width}%` }} />
      </div>
      <Fraction current={current} total={total} />
      <HeartRow hearts={hearts} />
    </div>
  );
}
