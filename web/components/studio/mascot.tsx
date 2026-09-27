export function ProfileAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#FFE7C2" />
      <circle cx="20" cy="18" r="8" fill="#F6C7A8" />
      <path d="M8 34c2-6 6-9 12-9s10 3 12 9" fill="#3D9A5C" />
      <path d="M12 16c1-6 4-8 8-8s7 2 8 8c-2-2-5-3-8-3s-6 1-8 3z" fill="#3A2A24" />
      <circle cx="17" cy="18" r="1.1" fill="#24302A" />
      <circle cx="23" cy="18" r="1.1" fill="#24302A" />
    </svg>
  );
}
