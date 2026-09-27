/**
 * LeafMascot — OpenSen's onboarding character.
 *
 * A friendly sprout wearing a leaf hat. Designed as a single flat-color SVG
 * so it stays crisp at any size and can be recolored via the `sen-*` design
 * tokens without shipping raster assets.
 */
type LeafMascotPose = "wave" | "map" | "idle" | "cheer";

const BODY = "#3FAE64";
const BODY_SHADE = "#2F9451";
const SKIN = "#FCE8C7";
const SKIN_SHADE = "#F4D19C";
const HAT = "#2E9B54";
const HAT_SHADE = "#1F7A40";
const CHEEK = "#F3A6A0";
const INK = "#1B2A22";

function Face() {
  return (
    <>
      <circle cx="17" cy="30" r="1.6" fill={INK} />
      <circle cx="27" cy="30" r="1.6" fill={INK} />
      <circle cx="15" cy="33.5" r="2.4" fill={CHEEK} opacity={0.7} />
      <circle cx="29" cy="33.5" r="2.4" fill={CHEEK} opacity={0.7} />
      <path
        d="M17 35c1.6 1.8 6.4 1.8 8 0"
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
        d="M22 6c6 0 11 4.4 11 10.4-3.6-2.6-7.4-3.6-11-3.6s-7.4 1-11 3.6C11 10.4 16 6 22 6z"
        fill={HAT}
      />
      <path
        d="M22 6c3.6 0 6.8 1.6 8.8 4.4-2.8-1-5.8-1.4-8.8-1.4s-6 .4-8.8 1.4C15.2 7.6 18.4 6 22 6z"
        fill={HAT_SHADE}
        opacity={0.5}
      />
      <path
        d="M22 3.2c.6 0 1 .5 1 1.1v3.4c0 .6-.4 1-1 1s-1-.4-1-1V4.3c0-.6.4-1.1 1-1.1z"
        fill={HAT_SHADE}
      />
    </g>
  );
}

function Body({ pose }: { pose: LeafMascotPose }) {
  return (
    <g>
      {/* head */}
      <circle cx="22" cy="29" r="12.5" fill={SKIN} />
      <path d="M9.5 30a12.5 12.5 0 0 0 3.2 8.4c-2-.6-3.7-2-4.6-4a12.6 12.6 0 0 1 1.4-4.4z" fill={SKIN_SHADE} opacity={0.5} />
      {/* body / leaf torso */}
      <path
        d="M13 40c0-7 4-11 9-11s9 4 9 11c0 4.5-4 7-9 7s-9-2.5-9-7z"
        fill={BODY}
      />
      <path
        d="M22 29c3.4 0 6.2 1.9 7.7 5-2.6-1.6-5.2-2.3-7.7-2.3s-5.1.7-7.7 2.3c1.5-3.1 4.3-5 7.7-5z"
        fill={BODY_SHADE}
        opacity={0.6}
      />
      <Face />
    </g>
  );
}

function Arms({ pose }: { pose: LeafMascotPose }) {
  if (pose === "wave") {
    return (
      <path
        d="M31 38c2.4-1.4 4-4 4.4-7.2"
        stroke={BODY}
        strokeWidth={4.2}
        strokeLinecap="round"
        fill="none"
      />
    );
  }
  if (pose === "map") {
    return (
      <>
        <path
          d="M13 39c-2 .4-3.6 2-4 4.4"
          stroke={BODY}
          strokeWidth={4.2}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M31 39c2 .4 3.6 2 4 4.4"
          stroke={BODY}
          strokeWidth={4.2}
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
          d="M13 39c-2.4-2.4-3-5.6-2-9"
          stroke={BODY}
          strokeWidth={4.2}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M31 39c2.4-2.4 3-5.6 2-9"
          stroke={BODY}
          strokeWidth={4.2}
          strokeLinecap="round"
          fill="none"
        />
      </>
    );
  }
  return (
    <>
      <path
        d="M13.5 40c-1.6 1-2.6 2.6-2.8 4.6"
        stroke={BODY}
        strokeWidth={4.2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M30.5 40c1.6 1 2.6 2.6 2.8 4.6"
        stroke={BODY}
        strokeWidth={4.2}
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
    <svg viewBox="0 0 44 48" className={className} aria-hidden>
      <Arms pose={pose} />
      <Body pose={pose} />
      <LeafHat />
    </svg>
  );
}
