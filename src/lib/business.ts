import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

/** The shop owner's legal details, from .env. Shown in the Impressum and filled into legal texts. */
export function businessDetails() {
  const e = process.env;
  return {
    legalName: e.BUSINESS_LEGAL_NAME ?? "",
    representative: e.BUSINESS_REPRESENTATIVE ?? "",
    street: e.BUSINESS_STREET ?? "",
    postcodeCity: e.BUSINESS_POSTCODE_CITY ?? "",
    phone: e.BUSINESS_PHONE ?? "",
    email: e.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
    vatId: e.BUSINESS_VAT_ID ?? "",
    register: e.BUSINESS_REGISTER ?? "",
  };
}

export const businessComplete = (b = businessDetails()) => !!(b.legalName && b.street && b.postcodeCity && b.email);

const PLACEHOLDER = (label: string) => `<mark class="missing">[${label} fehlt]</mark>`;

/**
 * Loads content/legal/<name>.md, fills {{placeholders}} from the business details and renders it.
 * The files are part of the repository, so their HTML is trusted.
 */
export async function legalDocument(name: "datenschutz" | "agb" | "widerruf") {
  const raw = await readFile(path.join(process.cwd(), "content", "legal", `${name}.md`), "utf8");
  const b = businessDetails();
  const values: Record<string, string> = {
    name: b.legalName || PLACEHOLDER("Name"),
    address: b.street && b.postcodeCity ? `${b.street}, ${b.postcodeCity}` : PLACEHOLDER("Anschrift"),
    email: b.email || PLACEHOLDER("E-Mail"),
    phone: b.phone || PLACEHOLDER("Telefon"),
  };
  const filled = raw.replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? `{{${k}}}`);
  const isDraft = filled.includes("<!-- ENTWURF -->");
  const title = filled.match(/^#\s+(.+)$/m)?.[1] ?? name;
  return { title, isDraft, html: await marked.parse(filled, { breaks: true }) };
}
