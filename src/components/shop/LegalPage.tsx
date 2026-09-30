import Link from "next/link";
import { legalDocument } from "@/lib/business";

export async function LegalPage({ name }: { name: "datenschutz" | "agb" | "widerruf" }) {
  const doc = await legalDocument(name);
  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{doc.title}</span></nav>
      {doc.isDraft && (
        <p className="warn" role="note" style={{ marginTop: 16 }}>
          <b>Entwurf / Draft.</b> This text is a starting point and has not been checked by a lawyer. Have it reviewed, or replace it with text from a legal-text service, before the shop goes live.
        </p>
      )}
      <article className="legal-text" dangerouslySetInnerHTML={{ __html: doc.html }} />
    </div>
  );
}
