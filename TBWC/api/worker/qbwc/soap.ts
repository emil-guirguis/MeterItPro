/**
 * Minimal SOAP helpers for the QBWebConnector service. QBWC envelopes are simple,
 * single-method, document/literal — so we hand-extract params by tag rather than
 * pulling in a full SOAP stack (node `soap` needs http.Server; won't run on workerd).
 *
 * Response bodies are qbXML strings that themselves contain XML, so every string
 * result is XML-escaped before being placed in the envelope.
 */

const QBWC_METHODS = [
  'serverVersion', 'clientVersion', 'authenticate', 'sendRequestXML',
  'receiveResponseXML', 'getLastError', 'closeConnection', 'connectionError',
] as const;
export type QbwcMethod = (typeof QBWC_METHODS)[number];

/** Detect which QBWC operation a SOAP envelope is invoking. */
export function parseMethod(body: string): QbwcMethod | null {
  for (const m of QBWC_METHODS) {
    // Match <m ...> or <ns:m ...> as an element open tag.
    const re = new RegExp(`<(?:[A-Za-z0-9]+:)?${m}(?:\\s|>|/)`);
    if (re.test(body)) return m;
  }
  return null;
}

/** Extract the text content of the first <tag> (namespace-agnostic), XML-unescaped. */
export function getParam(body: string, tag: string): string {
  const re = new RegExp(`<(?:[A-Za-z0-9]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[A-Za-z0-9]+:)?${tag}>`);
  const m = body.match(re);
  return m ? xmlUnescape(m[1]) : '';
}

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function xmlUnescape(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

/**
 * Wrap a method result in a SOAP 1.1 envelope. `resultInnerXml` is placed inside
 * <methodResult>…</methodResult> already-escaped (callers escape scalars; the
 * authenticate ArrayOfString builds its own child elements).
 */
export function envelope(method: QbwcMethod, resultInnerXml: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <${method}Response xmlns="http://developer.intuit.com/">
      <${method}Result>${resultInnerXml}</${method}Result>
    </${method}Response>
  </soap:Body>
</soap:Envelope>`;
}

/** authenticate returns an ArrayOfString: [ticket, companyFileOrStatus]. */
export function authEnvelope(values: string[]): string {
  const items = values.map((v) => `<string>${xmlEscape(v)}</string>`).join('');
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <authenticateResponse xmlns="http://developer.intuit.com/">
      <authenticateResult>${items}</authenticateResult>
    </authenticateResponse>
  </soap:Body>
</soap:Envelope>`;
}
