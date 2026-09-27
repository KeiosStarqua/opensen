type Accessory = "none" | "backpack" | "mic" | "cheer" | "wave";

export function MascotGlyph({ accessory = "none" }: { accessory?: Accessory }) {
  return (
    <g>
      {accessory === "backpack" ? (
        <g>
          <rect x="-62" y="-4" width="26" height="38" rx="10" fill="#2f9a55" />
          <rect x="36" y="-4" width="26" height="38" rx="10" fill="#2f9a55" />
          <path d="M-36 -2h72" stroke="#2f9a55" strokeWidth="7" strokeLinecap="round" />
        </g>
      ) : null}
      <ellipse cx="0" cy="20" rx="50" ry="44" fill="#FFF9F2" />
      <ellipse cx="0" cy="28" rx="34" ry="24" fill="#FFE9D2" opacity="0.55" />
      <ellipse cx="-18" cy="58" rx="16" ry="9" fill="#F6C7A8" />
      <ellipse cx="18" cy="58" rx="16" ry="9" fill="#F6C7A8" />
      {accessory === "cheer" ? (
        <g>
          <ellipse cx="-56" cy="-6" rx="16" ry="11" fill="#FFF9F2" transform="rotate(-38 -56 -6)" />
          <ellipse cx="56" cy="-6" rx="16" ry="11" fill="#FFF9F2" transform="rotate(38 56 -6)" />
        </g>
      ) : accessory === "wave" ? (
        <g>
          <ellipse cx="-48" cy="24" rx="14" ry="11" fill="#FFF9F2" />
          <ellipse cx="58" cy="-16" rx="14" ry="11" fill="#FFF9F2" transform="rotate(28 58 -16)" />
        </g>
      ) : (
        <g>
          <ellipse cx="-48" cy="24" rx="14" ry="11" fill="#FFF9F2" />
          <ellipse cx="48" cy="24" rx="14" ry="11" fill="#FFF9F2" />
        </g>
      )}
      <ellipse cx="-16" cy="8" rx="6.5" ry="8" fill="#24302A" />
      <ellipse cx="15" cy="8" rx="6.5" ry="8" fill="#24302A" />
      <circle cx="-14" cy="6" r="2.1" fill="white" />
      <circle cx="17" cy="6" r="2.1" fill="white" />
      <path
        d="M-12 24 Q1 34 15 22"
        stroke="#24302A"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="-30" cy="20" rx="7" ry="4.2" fill="#F4B2A8" />
      <ellipse cx="32" cy="20" rx="7" ry="4.2" fill="#F4B2A8" />
      <path d="M-4 -16 C10 -64 66 -58 30 -14 C16 -2 -8 -6 -4 -16 Z" fill="#2F9E56" />
      <path
        d="M12 -44 C16 -32 18 -24 14 -14"
        stroke="#1E7A40"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {accessory === "mic" ? (
        <g transform="translate(62 30)">
          <rect x="-8" y="-18" width="16" height="26" rx="8" fill="#1F9D52" />
          <path d="M-12 2 v6 a12 12 0 0 0 24 0 v-6" stroke="#1F9D52" strokeWidth="3" fill="none" />
          <path d="M0 16 v8" stroke="#1F9D52" strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
}

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
