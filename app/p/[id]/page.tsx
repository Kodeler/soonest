import type { Metadata } from "next";
import ProviderClient from "./ProviderClient";

export const metadata: Metadata = {
  title: "Provider — Soonest",
};

export default function ProviderPage() {
  return <ProviderClient />;
}
