/**
 * Resolves regulatory-clearance and grant links to the *specific* record rather
 * than a generic landing page. Much of the source data points clearances at the
 * FDA's generic AI/ML SaMD page and grants at bare agency homepages; here we
 * derive the canonical deep link from the clearance number / grant id instead.
 */

type Rec = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v)).trim();

// Generic destinations we never want to surface as "the link".
const GENERIC_URL = [
  /fda\.gov\/medical-devices\/software-medical-device-samd\/artificial-intelligence/i,
  /accessdata\.fda\.gov\/scripts\/cdrh\/cfdocs\/cf[a-z]+\/(pmn|pma|denovo)\.cfm\/?$/i,
];

function isBareDomain(url: string): boolean {
  try {
    const u = new URL(url);
    return u.pathname === "/" || u.pathname === "";
  } catch {
    return false;
  }
}

/** Specific FDA database URL for a clearance, derived from its number + type. */
export function clearanceUrl(c: Rec): string | null {
  const num = s(c.number).toUpperCase();

  const k = num.match(/^(K\d{6,})/);
  if (k) return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=${k[1]}`;

  const den = num.match(/^(DEN\d{6,})/);
  if (den) return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/denovo.cfm?ID=${den[1]}`;

  // PMA and supplements (P######, optionally /S###) → base PMA record.
  const pma = num.match(/^(P\d{6,})/);
  if (pma) return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMA/pma.cfm?id=${pma[1]}`;

  // Non-standard types (CLIA, IDE, CE Mark, narrative numbers): keep a provided
  // url only if it is itself specific; otherwise no link.
  const url = s(c.url);
  if (url && !GENERIC_URL.some((r) => r.test(url)) && !isBareDomain(url)) return url;
  return null;
}

/** Specific link for a federal grant, derived from its id when the url is generic. */
export function grantUrl(g: Rec): string | null {
  const url = s(g.url);
  if (url && !isBareDomain(url) && !GENERIC_URL.some((r) => r.test(url))) return url;

  const id = s(g.id) || s(g.program);

  // NIH funding opportunity announcements: PA-/PAR-/RFA-/NOT-...
  if (/^(PAR|PA|RFA|NOT)-[A-Z0-9-]+$/i.test(id)) {
    return `https://grants.nih.gov/grants/guide/pa-files/${id.toUpperCase()}.html`;
  }
  // NIH activity-coded project numbers (e.g., R01CA233585, U01HL..., R37CA222215).
  if (/^[A-Z]\d{2}[A-Z]{2}\d{4,}/i.test(id)) {
    return `https://reporter.nih.gov/search/?projectNums=${encodeURIComponent(id.toUpperCase())}`;
  }
  return null;
}
