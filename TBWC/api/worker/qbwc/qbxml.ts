/**
 * qbXML helpers shared by object modules.
 *
 * qbXML is the payload QuickBooks Desktop speaks: an XML doc wrapped in a
 * <?qbxml?> processing instruction and a <QBXML><QBXMLMsgsRq>…</> body. Each
 * request carries a requestID we echo back in the response so we can route it to
 * the right parser. We hand-extract fields (same rationale as soap.ts: no XML
 * lib needed for these shallow, well-known shapes).
 */

/** qbXML version negotiated with QB. 13.0 covers QB 2015+; safe broad default. */
export const QBXML_VERSION = '13.0';

/** Wrap one or more *Rq fragments in a full qbXML document. */
export function qbxmlDoc(inner: string, onError: 'stopOnError' | 'continueOnError' = 'continueOnError'): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="${QBXML_VERSION}"?>
<QBXML>
  <QBXMLMsgsRq onError="${onError}">
${inner}
  </QBXMLMsgsRq>
</QBXML>`;
}

/** First direct child text of <tag> within `scope` (namespace-agnostic), unescaped. */
export function tag(scope: string, name: string): string | undefined {
  const re = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`);
  const m = scope.match(re);
  return m ? unescapeXml(m[1]) : undefined;
}

/** All top-level <name>…</name> blocks within `scope` (non-nested same-name safe for QB rets). */
export function blocks(scope: string, name: string): string[] {
  const re = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(scope)) !== null) out.push(m[1]);
  return out;
}

/** Read the statusCode attribute of a *Rs response element. */
export function statusCode(scope: string, rsName: string): string | undefined {
  const re = new RegExp(`<${rsName}\\b[^>]*\\bstatusCode="([^"]*)"`);
  const m = scope.match(re);
  return m ? m[1] : undefined;
}

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/** QB TimeModified is ISO-8601 with offset; return a value Postgres accepts, or null. */
export function qbTimeToTs(v: string | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** QB dates are YYYY-MM-DD already; pass through or null. */
export function qbDate(v: string | undefined): string | null {
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

/** Number or null from a qbXML scalar. */
export function num(v: string | undefined): number | null {
  return v == null || v === '' ? null : Number(v);
}

/** Read a nested *Ref ({ListID, FullName}) block, e.g. CustomerRef, ItemRef. */
export function refField(scope: string, refName: string): { listId?: string; fullName?: string } {
  const b = blocks(scope, refName)[0];
  if (!b) return {};
  return { listId: tag(b, 'ListID'), fullName: tag(b, 'FullName') };
}

/** Extract transaction line rows (e.g. InvoiceLineRet) as a plain array. */
export function lineItems(scope: string, lineRetName: string): any[] {
  return blocks(scope, lineRetName).map((ln) => {
    const item = refField(ln, 'ItemRef');
    return {
      item: item.fullName ?? item.listId ?? null,
      desc: tag(ln, 'Desc') ?? null,
      quantity: num(tag(ln, 'Quantity')),
      rate: num(tag(ln, 'Rate')),
      amount: num(tag(ln, 'Amount')),
    };
  });
}
