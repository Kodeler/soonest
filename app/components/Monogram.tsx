"use client";

// Deterministic monogram avatar for providers. The mock businesses are
// fictional, so instead of fake logos every provider gets a stable identity
// mark derived from its name: a duotone gradient tile with a soft top light,
// an inset ring, and tracked initials.
const PALETTES: [string, string][] = [
  ["#7c3aed", "#4c1d95"], // violet
  ["#db2777", "#9d174d"], // pink
  ["#4f46e5", "#312e81"], // indigo
  ["#0d9488", "#134e4a"], // teal
  ["#d97706", "#92400e"], // amber
  ["#0891b2", "#164e63"], // cyan
  ["#e11d48", "#881337"], // rose
  ["#65a30d", "#3f6212"], // lime
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
      className={`relative flex items-center justify-center overflow-hidden text-white font-bold flex-shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        fontSize: size * 0.34,
        letterSpacing: "0.02em",
        background: `linear-gradient(140deg, ${from} 0%, ${to} 100%)`,
        boxShadow: `0 2px 8px -2px ${to}59, inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}
      aria-hidden
    >
      {/* soft top light for depth */}
      <span
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 65% at 25% 0%, rgba(255,255,255,0.28), transparent 60%)",
        }}
      />
      {/* inset ring */}
      <span
        className="absolute inset-0"
        style={{
          borderRadius: size * 0.3,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)",
        }}
      />
      <span className="relative" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.18)" }}>
        {initials(name)}
      </span>
    </div>
  );
}
