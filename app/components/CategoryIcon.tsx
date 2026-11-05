// Stroke icon set for service categories, matching the 24x24 stroke-icon
// style used across the app (round caps, fill-none, currentColor).
//
// The ServiceCategory.icon column stores an icon key (e.g. "scissors").
// Legacy rows seeded with emoji still resolve: EMOJI_TO_KEY maps them to the
// same keys, and unknown values fall back to the category slug, then to a
// generic calendar mark. Rendering stays purely data-driven.

const PATHS: Record<string, React.ReactNode> = {
  // Massage Therapy — open hand
  hand: (
    <>
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v2" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </>
  ),
  // Physiotherapy — pulse line
  activity: (
    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
  ),
  // Osteopath — bone
  bone: (
    <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />
  ),
  // Dentist — tooth
  tooth: (
    <path d="M12 5.3C10.3 3.6 7.6 3.3 6 4.9c-1.7 1.7-1.4 4.6-.5 6.7.9 2.1 1.4 4.3 1.7 6.6.1 1.1 1.6 1.3 2 .3l1.9-4.8c.3-.8 1.4-.8 1.7 0l1.9 4.8c.4 1 1.9.8 2-.3.3-2.3.8-4.5 1.7-6.6.9-2.1 1.2-5-.5-6.7-1.6-1.6-4.3-1.3-5.9.4Z" />
  ),
  // Haircut — scissors
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </>
  ),
  // Nails — sparkle
  sparkle: (
    <>
      <path d="M9.94 15.5a2 2 0 0 0-1.44-1.44l-6.13-1.58a.5.5 0 0 1 0-.96L8.5 9.94a2 2 0 0 0 1.44-1.44l1.58-6.13a.5.5 0 0 1 .96 0l1.58 6.13a2 2 0 0 0 1.44 1.44l6.13 1.58a.5.5 0 0 1 0 .96l-6.13 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.13a.5.5 0 0 1-.96 0Z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
    </>
  ),
  // Brows & Lashes — eye
  eye: (
    <>
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // Tattoo — pen tool
  pen: (
    <>
      <path d="M15.71 6.29a1 1 0 0 0 0 1.42l.58.58a1 1 0 0 0 1.42 0l2.58-2.58a1 1 0 0 0 0-1.42l-.58-.58a1 1 0 0 0-1.42 0Z" />
      <path d="M13.8 8.2 5 17l-2 5 5-2 8.8-8.8" />
      <path d="m6 16 2 2" />
    </>
  ),
  // Mechanic — wrench
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  // Chiropractor — spine
  spine: (
    <>
      <path d="M12 3c1.4 1.3 1.4 2.9 0 4.2-1.4 1.3-1.4 2.9 0 4.2 1.4 1.3 1.4 2.9 0 4.2-1.4 1.3-1.4 2.9 0 4.2" />
      <path d="M9.2 6.4h5.6" />
      <path d="M9.2 11.8h5.6" />
      <path d="M9.2 17.2h5.6" />
    </>
  ),
  // Facials & Spa — flower
  flower: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />
      <path d="M12 7.5V9" />
      <path d="M7.5 12H9" />
      <path d="M16.5 12H15" />
      <path d="M12 16.5V15" />
    </>
  ),
  // Fitness Classes — dumbbell
  dumbbell: (
    <>
      <path d="M14.4 14.4 9.6 9.6" />
      <path d="M18.66 21.49a2 2 0 1 1-2.83-2.83l-1.77 1.77a2 2 0 1 1-2.83-2.83l6.37-6.37a2 2 0 1 1 2.83 2.83l1.77-1.77a2 2 0 1 1 2.83 2.83z" />
      <path d="m21.5 21.5-1.4-1.4" />
      <path d="M3.9 3.9 2.5 2.5" />
      <path d="M6.4 12.77a2 2 0 1 1-2.83-2.83l1.77-1.77a2 2 0 1 1-2.83-2.83l2.83-2.83a2 2 0 1 1 2.83 2.83l1.77-1.77a2 2 0 1 1 2.83 2.83z" />
    </>
  ),
  // Yoga & Pilates — lotus
  lotus: (
    <>
      <path d="M12 20c-4.4 0-8-3.6-8-8 2.2 0 4.2.9 5.7 2.3" />
      <path d="M12 20c4.4 0 8-3.6 8-8-2.2 0-4.2.9-5.7 2.3" />
      <path d="M12 20c-2.5-1.8-4-4.7-4-7.7 0-3 1.5-5.9 4-7.7 2.5 1.8 4 4.7 4 7.7 0 3-1.5 5.9-4 7.7Z" />
    </>
  ),
  // Music Lessons — note
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  // Pet Grooming — paw
  paw: (
    <>
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="20" cy="16" r="2" />
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </>
  ),
  // Fallback — calendar
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </>
  ),
};

// Legacy emoji values stored in older ServiceCategory rows.
const EMOJI_TO_KEY: Record<string, string> = {
  "💆": "hand",
  "🏃": "activity",
  "🦴": "bone",
  "🦷": "tooth",
  "✂️": "scissors",
  "💅": "sparkle",
  "👁️": "eye",
  "🎨": "pen",
  "🔧": "wrench",
  "🤲": "spine",
  "🧖": "flower",
  "💪": "dumbbell",
  "🧘": "lotus",
  "🎸": "music",
  "🐩": "paw",
};

// Category slugs, as a second fallback when icon data is missing or unknown.
const SLUG_TO_KEY: Record<string, string> = {
  massage: "hand",
  physiotherapy: "activity",
  osteopath: "bone",
  dentist: "tooth",
  haircut: "scissors",
  nails: "sparkle",
  "brows-lashes": "eye",
  tattoo: "pen",
  mechanic: "wrench",
  chiropractor: "spine",
  spa: "flower",
  fitness: "dumbbell",
  yoga: "lotus",
  "music-lessons": "music",
  "pet-grooming": "paw",
};

interface Props {
  /** Icon key or legacy emoji from ServiceCategory.icon */
  icon?: string;
  /** Category slug, used as fallback when icon is missing/unknown */
  slug?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function CategoryIcon({
  icon,
  slug,
  size = 15,
  strokeWidth = 1.8,
  className = "",
}: Props) {
  const key =
    (icon && (PATHS[icon] ? icon : EMOJI_TO_KEY[icon])) ||
    (slug && SLUG_TO_KEY[slug]) ||
    "calendar";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[key] ?? PATHS.calendar}
    </svg>
  );
}
