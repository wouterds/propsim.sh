import { useId } from "react";

import type { Persona } from "./persona";

type Props = {
  persona: Persona;
  /** Drawn on a 32 unit grid and scaled to this many pixels. */
  size?: number;
};

/**
 * Every tint sits at a chroma nothing in the palette reaches, so a face can take
 * any hue without reading as a profit, a loss or a control.
 */
const tint = (hue: number) => ({
  top: `oklch(0.36 0.04 ${hue})`,
  bottom: `oklch(0.27 0.032 ${hue})`,
  edge: `oklch(0.46 0.045 ${hue})`,
  letters: `oklch(0.86 0.055 ${hue})`,
});

/** Decorative. Every face on the board is printed beside the name it belongs to. */
export const Avatar = ({ persona, size = 32 }: Props) => {
  const gradient = useId();
  const colour = tint(persona.hue);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour.top} />
          <stop offset="100%" stopColor={colour.bottom} />
        </linearGradient>
      </defs>

      <circle cx="16" cy="16" r="16" fill={`url(#${gradient})`} />
      <circle cx="16" cy="16" r="15.5" fill="none" stroke={colour.edge} strokeOpacity="0.55" />

      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="12.5"
        fontWeight="500"
        letterSpacing="0.2"
        fill={colour.letters}
      >
        {persona.initials}
      </text>
    </svg>
  );
};
