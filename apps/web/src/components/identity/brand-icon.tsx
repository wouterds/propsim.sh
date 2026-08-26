import type { IconDefinition } from "@fortawesome/free-brands-svg-icons";

type Props = {
  icon: IconDefinition;
  className?: string;
};

/**
 * The glyph out of a Font Awesome definition, drawn straight. The React package
 * around these wants the icon library and its core alongside it, which is three
 * dependencies to render one path.
 */
const BrandIcon = ({ icon, className }: Props) => {
  const [width, height, , , path] = icon.icon;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      className={className}
    >
      <path d={Array.isArray(path) ? path.join(" ") : path} />
    </svg>
  );
};

export default BrandIcon;
