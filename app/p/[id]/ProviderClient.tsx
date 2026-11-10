"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProviderDetail from "@/app/components/ProviderDetail";
import BookingFlow from "@/app/components/BookingFlow";
import Confirmation from "@/app/components/Confirmation";
import Logo from "@/app/components/Logo";

export default function ProviderClient() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    bookingId: string;
    providerName: string;
    slotTime: string;
    bookingUrl?: string;
  } | null>(null);

  // Prefer real history (preserves results scroll position); fall back to a
  // fresh search when the page was opened directly.
  const backToResults = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/search");
    }
  };

  return (
    <div className="h-dvh flex flex-col bg-surface">
      <header className="glass z-20 border-b border-violet-100/80 px-5 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="Soonest home">
          <Logo size={30} />
        </Link>
        <Link
          href="/providers"
          className="text-sm font-semibold text-stone-500 hover:text-primary transition-colors"
        >
          For businesses
        </Link>
      </header>

      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">
        {bookingResult ? (
          <Confirmation
            booking={bookingResult}
            onFindAnother={() => router.push("/")}
          />
        ) : bookingSlotId ? (
          <BookingFlow
            slotId={bookingSlotId}
            providerId={id}
            onBack={() => setBookingSlotId(null)}
            onSuccess={(result) => {
              setBookingResult(result);
              setBookingSlotId(null);
            }}
            onSlotTaken={() => router.push("/search")}
          />
        ) : (
          <ProviderDetail
            providerId={id}
            onBack={backToResults}
            onBook={(slotId) => {
              setBookingSlotId(slotId);
              window.scrollTo(0, 0);
            }}
          />
        )}
      </main>
    </div>
  );
}
