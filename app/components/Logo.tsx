"use client";

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size * 3.5}
      height={size}
      viewBox="0 0 140 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speed lines */}
      <circle cx="4" cy="18" r="2" fill="#7c3aed" />
      <circle cx="4" cy="24" r="1.5" fill="#7c3aed" opacity="0.7" />
      <rect x="8" y="17" width="8" height="2.5" rx="1.25" fill="#7c3aed" opacity="0.8" />
      <rect x="6" y="22" width="6" height="2" rx="1" fill="#7c3aed" opacity="0.6" />

      {/* S letterform */}
      <path
        d="M22 8c8 0 14 3 14 9 0 4-3 7-8 8l8 8c2 2 1 5-2 5h-4l-10-11h-2v6c0 2-2 4-4 4s-4-2-4-4V14c0-3 3-6 6-6h6z
           M18 14v7h6c3 0 5-1.5 5-3.5S27 14 24 14h-6z"
        fill="url(#sGradient)"
      />

      {/* Wordmark */}
      <text
        x="48"
        y="30"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="22"
        fontWeight="800"
        letterSpacing="-0.5"
        fill="#1a1a2e"
      >
        soonest
      </text>

      <defs>
        <linearGradient id="sGradient" x1="14" y1="8" x2="36" y2="38">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
