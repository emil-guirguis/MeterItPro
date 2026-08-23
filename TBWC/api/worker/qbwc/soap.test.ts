import { describe, it, expect } from 'vitest';
import {
  parseMethod, getParam, xmlEscape, xmlUnescape, envelope, authEnvelope,
} from './soap';

/** Wrap a QBWC method body in a realistic SOAP 1.1 request envelope. */
function req(method: string, inner = ''): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://developer.intuit.com/">${inner}</${method}>
  </soap:Body>
</soap:Envelope>`;
}

describe('soap.parseMethod', () => {
  it('detects each QBWC operation', () => {
    for (const m of [
      'serverVersion', 'clientVersion', 'authenticate', 'sendRequestXML',
      'receiveResponseXML', 'getLastError', 'closeConnection', 'connectionError',
    ]) {
      expect(parseMethod(req(m))).toBe(m);
    }
  });

  it('matches namespaced element tags', () => {
    expect(parseMethod('<ns1:authenticate xmlns:ns1="x"></ns1:authenticate>')).toBe('authenticate');
  });

  it('matches self-closing tags', () => {
    expect(parseMethod('<serverVersion/>')).toBe('serverVersion');
  });

  it('returns null for an unknown method', () => {
    expect(parseMethod(req('somethingElse'))).toBeNull();
  });

  it('does not match a method name that is only a substring of another tag', () => {
    // "authenticateFoo" must not be read as "authenticate"
    expect(parseMethod('<authenticateFoo></authenticateFoo>')).toBeNull();
  });
});

describe('soap.getParam', () => {
  it('extracts the first tag text', () => {
    expect(getParam(req('authenticate', '<strUserName>tbwc</strUserName>'), 'strUserName')).toBe('tbwc');
  });

  it('is namespace-agnostic on the extracted tag', () => {
    expect(getParam('<ns:ticket>abc-123</ns:ticket>', 'ticket')).toBe('abc-123');
  });

  it('unescapes XML entities in the value', () => {
    expect(getParam('<response>&lt;QBXML&gt;&amp;</response>', 'response')).toBe('<QBXML>&');
  });

  it('returns empty string when the tag is absent', () => {
    expect(getParam('<a>x</a>', 'ticket')).toBe('');
  });

  it('handles attributes on the tag', () => {
    expect(getParam('<ticket foo="1">t</ticket>', 'ticket')).toBe('t');
  });
});

describe('soap xml escape/unescape', () => {
  it('escapes the five XML metacharacters', () => {
    expect(xmlEscape(`<a b="c" d='e' & f>`)).toBe('&lt;a b=&quot;c&quot; d=&apos;e&apos; &amp; f&gt;');
  });

  it('round-trips through unescape', () => {
    const raw = `<QBXML onError="stop">A & B 'x' "y"</QBXML>`;
    expect(xmlUnescape(xmlEscape(raw))).toBe(raw);
  });

  it('unescape resolves &amp; last so escaped entities survive', () => {
    // A literal "&lt;" in source (i.e. &amp;lt;) must decode to "&lt;", not "<".
    expect(xmlUnescape('&amp;lt;')).toBe('&lt;');
  });
});

describe('soap.envelope', () => {
  it('wraps result in <methodResponse><methodResult>', () => {
    const out = envelope('serverVersion', '1.0.0');
    expect(out).toContain('<serverVersionResponse xmlns="http://developer.intuit.com/">');
    expect(out).toContain('<serverVersionResult>1.0.0</serverVersionResult>');
    expect(out).toContain('http://schemas.xmlsoap.org/soap/envelope/');
  });

  it('places already-escaped inner xml verbatim', () => {
    const out = envelope('sendRequestXML', '&lt;QBXML&gt;');
    expect(out).toContain('<sendRequestXMLResult>&lt;QBXML&gt;</sendRequestXMLResult>');
  });
});

describe('soap.authEnvelope', () => {
  it('emits an ArrayOfString with one <string> per value', () => {
    const out = authEnvelope(['ticket-1', '']);
    expect(out).toContain('<authenticateResult><string>ticket-1</string><string></string></authenticateResult>');
  });

  it('escapes each value', () => {
    const out = authEnvelope(['a&b', 'nvu']);
    expect(out).toContain('<string>a&amp;b</string>');
  });
});
