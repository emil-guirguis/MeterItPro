/**
 * Zero-dependency logging utilities — safe for any runtime
 * (Cloudflare Workers, Node.js, browsers).
 */

/** Inline $1/$2 params into a SQL string and add line breaks at keywords for readable console output. */
export function formatSqlForDebug(text: string, params: any[] = []): string {
  const inlined = text.replace(/\$(\d+)/g, (_, i) => {
    const val = params[parseInt(i, 10) - 1];
    let formatted: string;
    if (val === null || val === undefined) formatted = 'NULL';
    else if (typeof val === 'number') formatted = String(val);
    else if (typeof val === 'boolean') formatted = String(val);
    else if (val instanceof Date) formatted = `'${val.toISOString()}'`;
    else formatted = `'${String(val).replace(/'/g, "''")}'`;
    return formatted;
  });
  return inlined
    .replace(/\b(SELECT|FROM|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|WHERE|GROUP BY|ORDER BY|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|RETURNING|ON CONFLICT|DO UPDATE SET)\b/gi,
      '\n  $1');
}

/**
 * Patch the global console to prepend HH:MM:SS timestamps to every log line.
 * Call once at startup (top of the Worker entry point).
 */
export function patchConsoleWithTimestamps(): void {
  const ts = () => new Date().toTimeString().slice(0, 8);
  const origLog   = console.log.bind(console);
  const origWarn  = console.warn.bind(console);
  const origError = console.error.bind(console);
  console.log   = (...a: any[]) => origLog  (`[${ts()}]`, ...a);
  console.warn  = (...a: any[]) => origWarn (`[${ts()}]`, ...a);
  console.error = (...a: any[]) => origError(`[${ts()}]`, ...a);
}
