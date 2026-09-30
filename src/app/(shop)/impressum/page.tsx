import Link from "next/link";
import type { Metadata } from "next";
import { businessComplete, businessDetails } from "@/lib/business";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Impressum" };

const Missing = ({ what }: { what: string }) => <mark className="missing">[{what} fehlt]</mark>;

export default function ImpressumPage() {
  const b = businessDetails();
  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Impressum</span></nav>
      {!businessComplete(b) && (
        <p className="warn" role="note" style={{ marginTop: 16 }}>
          <b>Not complete.</b> Fill in the BUSINESS_… settings and NEXT_PUBLIC_CONTACT_EMAIL in <code>.env</code> before the shop goes live.
        </p>
      )}
      <article className="legal-text">
        <h1>Impressum</h1>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          {b.legalName || <Missing what="Name" />}<br />
          {b.representative && <>Vertreten durch: {b.representative}<br /></>}
          {b.street || <Missing what="Straße" />}<br />
          {b.postcodeCity || <Missing what="PLZ und Ort" />}
        </p>
        <h2>Kontakt</h2>
        <p>
          {b.phone && <>Telefon: {b.phone}<br /></>}
          E-Mail: {b.email || <Missing what="E-Mail" />}
        </p>
        {b.register && (<><h2>Registereintrag</h2><p>{b.register}</p></>)}
        {b.vatId && (<><h2>Umsatzsteuer-ID</h2><p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {b.vatId}</p></>)}
        <h2>Verbraucherstreitbeilegung</h2>
        <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </article>
    </div>
  );
}
