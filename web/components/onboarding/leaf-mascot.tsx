/**
 * LeafMascot — OpenSen's onboarding character.
 *
 * Sen: a round cream-yellow bean wearing a green leaf beret. Designed as a
 * single flat-color SVG so it stays crisp at any size and can be recolored
 * via the `sen-*` design tokens without shipping raster assets. Matches the
 * illustrated Sen mascot used across marketing art (leaf-vein beret with a
 * stem nub, black dot eyes, pink cheek blush, stubby rounded limbs).
 */
type LeafMascotPose = "wave" | "map" | "idle" | "cheer";

const BODY = "#FBE7A1";
const BODY_SHADE = "#F3D678";
const HAT = "#6FBE6B";
const HAT_SHADE = "#4E9E4C";
const HAT_VEIN = "#3F8A3F";
const CHEEK = "#F6AFA0";
const INK = "#1B2A22";

function Face() {
  return (
    <>
      <circle cx="17" cy="29" r="1.7" fill={INK} />
      <circle cx="27" cy="29" r="1.7" fill={INK} />
      <circle cx="14.5" cy="33.5" r="2.6" fill={CHEEK} opacity={0.8} />
      <circle cx="29.5" cy="33.5" r="2.6" fill={CHEEK} opacity={0.8} />
      <path
        d="M18 34.5c1.4 1.6 5.6 1.6 7 0"
        stroke={INK}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

function LeafHat() {
  return (
    <g>
      <path
        d="M22 5c6.4 0 11.6 4.2 11.6 9.8 0 1-1.2 1.6-2 1-3-2.2-6.2-3.2-9.6-3.2s-6.6 1-9.6 3.2c-.8.6-2 0-2-1C10.4 9.2 15.6 5 22 5z"
        fill={HAT}
      />
      <path
        d="M22 8.4c4.2 0 8 1.7 10.4 4.4.3.3.1.9-.3.7-3.2-1.5-6.6-2.3-10.1-2.3s-6.9.8-10.1 2.3c-.4.2-.6-.4-.3-.7 2.4-2.7 6.2-4.4 10.4-4.4z"
        fill={HAT_SHADE}
        opacity={0.55}
      />
      <path
        d="M17.5 9.6c1.4-2.4 2.9-4.6 4-6.1M22 3.5c1.7 1.2 3.6 3.1 5 5.5"
        stroke={HAT_VEIN}
        strokeWidth={0.7}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <path
        d="M22 2c.7 0 1.2.6 1.2 1.3v3c0 .7-.5 1.2-1.2 1.2s-1.2-.5-1.2-1.2v-3C20.8 2.6 21.3 2 22 2z"
        fill={HAT_SHADE}
      />
    </g>
  );
}

function Body() {
  return (
    <g>
      {/* round bean body */}
      <ellipse cx="22" cy="32" rx="13.5" ry="14" fill={BODY} />
      <path
        d="M9 33a13.5 14 0 0 0 4 9.6c-2.3-.7-4.2-2.3-5.2-4.6A13.6 14 0 0 1 9 33z"
        fill={BODY_SHADE}
        opacity={0.45}
      />
      <Face />
      {/* stubby feet */}
      <ellipse cx="17" cy="46.5" rx="3.4" ry="2.6" fill={BODY} />
      <ellipse cx="27" cy="46.5" rx="3.4" ry="2.6" fill={BODY} />
    </g>
  );
}

function Arms({ pose }: { pose: LeafMascotPose }) {
  if (pose === "wave") {
    return (
      <path
        d="M32 34c2.6-1.2 4.6-3.8 5.4-7"
        stroke={BODY}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  if (pose === "map") {
    return (
      <>
        <path
          d="M11 35c-2.2.2-4 1.8-4.6 4.2"
          stroke={BODY}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M33 35c2.2.2 4 1.8 4.6 4.2"
          stroke={BODY}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  }
  if (pose === "cheer") {
    return (
      <>
        <path
          d="M11 35c-2.6-2.2-3.4-5.4-2.4-8.8"
          stroke={BODY}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M33 35c2.6-2.2 3.4-5.4 2.4-8.8"
          stroke={BODY}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  }
  return (
    <>
      <path
        d="M11.5 36c-1.8.9-3 2.5-3.3 4.5"
        stroke={BODY}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32.5 36c1.8.9 3 2.5 3.3 4.5"
        stroke={BODY}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

export function LeafMascot({
  pose = "idle",
  className,
}: {
  pose?: LeafMascotPose;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 44 50" className={className} aria-hidden>
      <Arms pose={pose} />
      <Body />
      <LeafHat />
    </svg>
  );
}
