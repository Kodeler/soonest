"use client";

import { useId } from "react";

// Brand lockup: the speed-S mark (vector-traced from the original
// public/logo.png so the shape is identical, now crisp at any size and
// themeable) plus the wordmark set live in Geist instead of a raster.
// public/logo.png remains only as the og-image / manifest source.

const MARK_PATH =
  "M 195.500 21.648 C 154.213 30.230, 128.805 66.806, 134.300 109.750 L 135.099 116 97.050 116 C 60.333 116, 58.930 116.070, 57 118 C 53.942 121.058, 54.273 127.283, 57.635 129.927 C 60.202 131.947, 61.309 132, 100.936 132 L 141.601 132 143.689 136.298 C 144.838 138.661, 148.077 143.112, 150.889 146.188 C 153.700 149.264, 156 152.055, 156 152.390 C 156 152.726, 137.583 153, 115.073 153 L 74.145 153 72.073 155.635 C 69.267 159.201, 69.418 163.509, 72.455 166.545 L 74.909 169 154.300 169 C 229.942 169, 233.768 168.914, 235.345 167.171 C 236.255 166.165, 237 164.654, 237 163.813 C 237 162.972, 226.168 152.208, 212.929 139.893 C 199.690 127.577, 187.582 115.574, 186.021 113.218 C 177.987 101.089, 180.237 84.367, 191.233 74.480 C 199.389 67.148, 200.479 67, 246.471 67 C 290.140 67, 293.208 66.689, 303.423 61.217 C 316.858 54.022, 336.238 27.607, 331.910 22.392 C 330.811 21.067, 201.682 20.363, 195.500 21.648 M 226.571 102.571 C 225.707 103.436, 225 104.661, 225 105.294 C 225 106.650, 235.327 116.794, 257.787 137.500 C 271.040 149.718, 274.609 153.596, 277.029 158.410 C 283.176 170.638, 280.051 186.504, 269.701 195.614 C 262.530 201.927, 261.920 201.999, 215.884 202.008 C 170.390 202.016, 164.797 202.503, 155.009 207.311 C 140.067 214.651, 121.238 238.971, 125.023 246.043 C 126.047 247.957, 127.583 248, 194.285 247.983 C 271.376 247.963, 270.429 248.040, 285.633 240.536 C 321.611 222.780, 337.901 176.459, 320.952 140.107 C 312.013 120.934, 295.620 106.951, 276.912 102.541 C 267.462 100.313, 228.806 100.337, 226.571 102.571 M 21.073 155.635 C 18.267 159.201, 18.418 163.509, 21.455 166.545 C 25.175 170.266, 42.341 170.267, 46.354 166.548 C 49.596 163.543, 49.819 159.311, 46.927 155.635 C 44.916 153.077, 44.536 153, 34 153 C 23.464 153, 23.084 153.077, 21.073 155.635";

interface Props {
  /** Mark height in px; the lockup scales from this. */
  size?: number;
  /** Render the "soonest" wordmark next to the mark. */
  wordmark?: boolean;
  className?: string;
}

export default function Logo({ size = 30, wordmark = true, className = "" }: Props) {
  const gradientId = useId();

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: size * 0.28 }}
    >
      <svg
        width={(size * 340) / 256}
        height={size}
        viewBox="0 0 340 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="80" y1="20" x2="300" y2="250" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6d3bf7" />
            <stop offset="100%" stopColor="#5222e0" />
          </linearGradient>
        </defs>
        <path d={MARK_PATH} fill={`url(#${gradientId})`} fillRule="evenodd" />
      </svg>
      {wordmark && (
        <span
          className="font-extrabold text-ink leading-none select-none"
          style={{ fontSize: size * 0.82, letterSpacing: "-0.035em" }}
        >
          soonest
        </span>
      )}
    </span>
  );
}
