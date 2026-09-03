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

/** Timezone of the QuickBooks Desktop machine (SVR2012). QB stores/returns
 *  TimeModified in this local zone; incremental FromModifiedDate must match it. */
export const QB_TIMEZONE = 'America/Los_Angeles';

/**
 * Render a UTC instant as a qbXML dateTime in QB's local zone WITH an explicit
 * offset (YYYY-MM-DDThh:mm:ss±hh:mm). We store QB's TimeModified as UTC in
 * Postgres; when we send it back as FromModifiedDate, a bare (offset-less) value
 * is read by QB as ITS local time, shifting the incremental window by the whole
 * UTC offset. Emitting the local wall-clock plus the offset removes the ambiguity.
 */
export function toQbLocal(utc: string | Date, tz: string = QB_TIMEZONE): string {
  const d = typeof utc === 'string' ? new Date(utc) : utc;
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p: Record<string, string> = {};
  for (const { type, value } of fmt.formatToParts(d)) p[type] = value;
  const hh = p.hour === '24' ? '00' : p.hour; // some ICU builds emit 24 at midnight
  // Offset = (same wall-clock read as UTC) - (actual instant).
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +hh, +p.minute, +p.second);
  const offMin = Math.round((asUtc - d.getTime()) / 60000);
  const sign = offMin >= 0 ? '+' : '-';
  const abs = Math.abs(offMin);
  const oh = String(Math.floor(abs / 60)).padStart(2, '0');
  const om = String(abs % 60).padStart(2, '0');
  return `${p.year}-${p.month}-${p.day}T${hh}:${p.minute}:${p.second}${sign}${oh}:${om}`;
}

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

/** QB's FromModifiedDate filter is inclusive (>=), and TimeModified granularity
 *  is whole seconds — so the last record we stored (time_modified == our "since"
 *  boundary) matches again on every subsequent poll. Bump by 1s to exclude it. */
export function bumpSecond(iso: string): string {
  return new Date(new Date(iso).getTime() + 1000).toISOString();
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
