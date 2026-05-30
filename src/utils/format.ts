export function formatCurrency(amount: number): string {
  return `R${Math.abs(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)),
  );
  const sep = widths.map((w) => '-'.repeat(w)).join('-+-');
  console.log(headers.map((h, i) => h.padEnd(widths[i])).join(' | '));
  console.log(sep);
  for (const row of rows) {
    console.log(row.map((c, i) => (c ?? '').padEnd(widths[i])).join(' | '));
  }
}

export function bar(pct: number, width = 10): string {
  const filled = Math.round((Math.min(pct, 100) / 100) * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
}
