// Small shared stroke icons used across the UI, replacing emoji glyphs so
// every surface renders the same 24x24 round-cap stroke style.

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  /** "none" (default) for outline, "currentColor" for filled */
  fill?: string;
}

function base({ size = 14, className = "", strokeWidth = 2, fill = "none" }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill,
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: props.fill ? 1 : 2, ...props })}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function MapIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14.1 6.1 9.9 4 4.6 6.6a1 1 0 0 0-.6.9v11a1 1 0 0 0 1.4.9l4.5-2.2 4.2 2.1 5.3-2.6a1 1 0 0 0 .6-.9v-11a1 1 0 0 0-1.4-.9l-4.5 2.2Z" />
      <path d="M9.9 4v13.2" />
      <path d="M14.1 6.1v13.2" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}
