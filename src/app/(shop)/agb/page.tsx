import type { Metadata } from "next";
import { LegalPage } from "@/components/shop/LegalPage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AGB (Terms of sale)" };

export default function Page() {
  return <LegalPage name="agb" />;
}
