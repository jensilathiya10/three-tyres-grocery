import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/LegalPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Datenschutzerklärung (Privacy policy)" };

export default function Page() {
  return <LegalPage name="datenschutz" />;
}
