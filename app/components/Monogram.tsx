"use client";

// Deterministic gradient monogram avatar for providers. The mock businesses
// are fictional, so instead of fake logos every provider gets a stable,
// polished identity mark derived from its name.
const PALETTES = [
  ["#8b5cf6", "#6d28d9"], // violet
  ["#ec4899", "#be185d"], // pink
  ["#6366f1", "#4338ca"], // indigo
  ["#10b981", "#047857"], // emerald
  ["#f59e0b", "#b45309"], // amber
  ["#06b6d4", "#0e7490"], // cyan
  ["#f43f5e", "#be123c"], // rose
  ["#84cc16", "#4d7c0f"], // lime
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function Monogram({ name, size = 40, className = "" }: Props) {
  const [from, to] = PALETTES[hashName(name) % PALETTES.length];

  return (
    <div
      className={`flex items-center justify-center rounded-xl text-white font-bold flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: `0 2px 8px -2px ${to}66`,
      }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
