import type { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search appointments — Soonest",
  description:
    "Toronto appointments ranked by who can take you first. Search massage, hair, fitness, dental and more.",
};

export default function SearchPage() {
  return (
    <Suspense>
      <SearchClient />
    </Suspense>
  );
}
