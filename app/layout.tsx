import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://soonest.today"
  ),
  title: "Soonest — Don't book soon. Book soonest.",
  description:
    "One search across massage, hair, fitness, dental and more — ranked by who can take you first. Toronto appointments, booked in under a minute.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Soonest — Don't book soon. Book soonest.",
    description:
      "Toronto appointments ranked by who can take you first. Book in under a minute.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Soonest",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6d28d9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-[family-name:var(--font-geist)] pb-[env(safe-area-inset-bottom)]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
