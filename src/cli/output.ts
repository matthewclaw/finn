import { printTable, formatCurrency, formatPct, bar } from '../utils/format';
import type {
  TransactionView,
  MonthlySummary,
  BudgetStatus,
  RecurringPattern,
  ImportResult,
} from '../types';

const isTTY = process.stdout.isTTY ?? false;

export function out(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function err(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (isTTY) {
    console.error(`\x1b[31mError:\x1b[0m ${message}`);
  } else {
    console.error(JSON.stringify({ error: message }));
  }
  process.exit(1);
}

export function printTransactions(txs: TransactionView[]): void {
  if (!isTTY) return out(txs);
  if (txs.length === 0) {
    console.log('No transactions found.');
    return;
  }
  printTable(
    ['Date', 'Amount', 'Description', 'Category', 'Merchant', 'Owner'],
    txs.map((t) => [
      t.date,
      formatCurrency(t.amount),
      t.description.slice(0, 40),
      t.category_name ?? '-',
      t.merchant_name ?? '-',
      t.owner_name,
    ]),
  );
}

export function printSummary(s: MonthlySummary): void {
  if (!isTTY) return out(s);

  const title = s.owner ? `${s.owner} — ${s.month}` : s.month;
  console.log(`\n=== Monthly Report: ${title} ===\n`);
  console.log(`Total Expenses:  ${formatCurrency(s.total_expenses)}`);
  console.log(`Total Income:    ${formatCurrency(s.total_income)}`);
  const sign = s.net_flow >= 0 ? '+' : '-';
  console.log(`Net Flow:        ${sign}${formatCurrency(s.net_flow)}`);
  console.log(`Transactions:    ${s.transaction_count}\n`);

  if (s.by_category.length > 0) {
    console.log('By Category:');
    for (const c of s.by_category) {
      const pct = s.total_expenses > 0 ? (c.total / s.total_expenses) * 100 : 0;
      const name = (c.category_name ?? 'Uncategorised').padEnd(22);
      console.log(`  ${name} ${formatCurrency(c.total).padStart(12)}  ${formatPct(pct).padStart(6)}  ${bar(pct)}`);
    }
  }

  if (s.top_merchants.length > 0) {
    console.log('\nTop Merchants:');
    for (const m of s.top_merchants.slice(0, 5)) {
      const name = (m.merchant_name ?? 'Unknown').padEnd(22);
      console.log(`  ${name} ${formatCurrency(m.total).padStart(12)}   ${m.count} txns`);
    }
  }

  console.log('');
}

export function printBudgetStatus(statuses: BudgetStatus[]): void {
  if (!isTTY) return out(statuses);
  if (statuses.length === 0) {
    console.log('No budgets set for this period.');
    return;
  }
  console.log('');
  for (const s of statuses) {
    const name = s.category_name.padEnd(22);
    const over = s.remaining < 0 ? ' \x1b[31mOVER\x1b[0m' : '';
    console.log(
      `  ${name} ${formatCurrency(s.spent).padStart(12)} / ${formatCurrency(s.budgeted).padStart(12)}  ${formatPct(s.pct_used).padStart(6)}  ${bar(s.pct_used)}${over}`,
    );
  }
  console.log('');
}

export function printImportResult(r: ImportResult): void {
  if (!isTTY) return out(r);
  console.log(`\nImport complete:`);
  console.log(`  Inserted: ${r.inserted}`);
  console.log(`  Skipped (duplicates): ${r.skipped}`);
  if (r.errors.length > 0) {
    console.log(`  Errors (${r.errors.length}):`);
    r.errors.forEach((e) => console.log(`    - ${e}`));
  }
  console.log(`  Batch ID: ${r.batch_id}\n`);
}

export function printRecurring(patterns: RecurringPattern[]): void {
  if (!isTTY) return out(patterns);
  if (patterns.length === 0) {
    console.log('No recurring patterns found.');
    return;
  }
  printTable(
    ['Description', 'Amount', 'Frequency', 'Day', 'Last Seen'],
    patterns.map((p) => [
      p.description.slice(0, 35),
      formatCurrency(p.amount),
      p.frequency,
      p.day_of_month?.toString() ?? '-',
      p.last_seen,
    ]),
  );
}
