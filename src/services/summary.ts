import { queryTransactions } from '../db/queries/transactions';
import { listCategories } from '../db/queries/categories';
import { listMerchants } from '../db/queries/merchants';
import { resolveOwner } from './owners';
import { monthBounds, currentMonth, previousMonth } from '../utils/date';
import type {
  Transaction,
  MonthlySummary,
  CategoryTotal,
  MerchantTotal,
  MonthComparison,
} from '../types';

export async function monthlySummary(
  month: string,
  ownerName?: string,
): Promise<MonthlySummary> {
  const { start, end } = monthBounds(month);

  let ownerId: string | undefined;
  if (ownerName) {
    const owner = await resolveOwner(ownerName);
    ownerId = owner.id;
  }

  const txs = await queryTransactions({
    owner: ownerId,
    startDate: start,
    endDate: end,
    limit: 10000,
  });

  const [cats, merchants] = await Promise.all([listCategories(), listMerchants()]);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const merchantMap = new Map(merchants.map((m) => [m.id, m.name]));

  return aggregateSummary(txs, month, ownerName ?? null, catMap, merchantMap);
}

export async function compareToLastMonth(
  month: string,
  ownerName?: string,
): Promise<{ current: MonthlySummary; previous: MonthlySummary; comparison: MonthComparison[] }> {
  const prev = previousMonth(month);
  const [current, previous] = await Promise.all([
    monthlySummary(month, ownerName),
    monthlySummary(prev, ownerName),
  ]);

  const currentByCategory = new Map(current.by_category.map((c) => [c.category_name, c.total]));
  const prevByCategory = new Map(previous.by_category.map((c) => [c.category_name, c.total]));

  const allCategories = new Set([...currentByCategory.keys(), ...prevByCategory.keys()]);

  const comparison: MonthComparison[] = Array.from(allCategories)
    .map((cat) => {
      const curr = currentByCategory.get(cat) ?? 0;
      const prev = prevByCategory.get(cat) ?? 0;
      const delta = curr - prev;
      const delta_pct = prev === 0 ? 0 : (delta / prev) * 100;
      return { category_name: cat, current_total: curr, previous_total: prev, delta, delta_pct };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return { current, previous, comparison };
}

export async function spendingTrends(
  months: number,
  ownerName?: string,
): Promise<MonthlySummary[]> {
  const results: MonthlySummary[] = [];
  let month = currentMonth();
  for (let i = 0; i < months; i++) {
    results.push(await monthlySummary(month, ownerName));
    month = previousMonth(month);
  }
  return results.reverse();
}

function aggregateSummary(
  txs: Transaction[],
  month: string,
  ownerName: string | null,
  catMap: Map<string, string>,
  merchantMap: Map<string, string>,
): MonthlySummary {
  let totalExpenses = 0;
  let totalIncome = 0;
  const byCategoryMap = new Map<string | null, CategoryTotal>();
  const byMerchantMap = new Map<string | null, MerchantTotal>();

  for (const tx of txs) {
    if (tx.amount >= 0) {
      totalExpenses += tx.amount;
    } else {
      totalIncome += Math.abs(tx.amount);
    }

    const catName = tx.category_id ? (catMap.get(tx.category_id) ?? null) : null;
    const catKey = catName ?? '__uncategorized__';
    const catEntry = byCategoryMap.get(catKey) ?? {
      category_id: tx.category_id,
      category_name: catName,
      total: 0,
      count: 0,
    };
    catEntry.total += tx.amount;
    catEntry.count += 1;
    byCategoryMap.set(catKey, catEntry);

    const mName = tx.merchant_id ? (merchantMap.get(tx.merchant_id) ?? null) : null;
    const mKey = mName ?? '__unknown__';
    const mEntry = byMerchantMap.get(mKey) ?? {
      merchant_id: tx.merchant_id,
      merchant_name: mName,
      total: 0,
      count: 0,
    };
    mEntry.total += tx.amount;
    mEntry.count += 1;
    byMerchantMap.set(mKey, mEntry);
  }

  const by_category: CategoryTotal[] = Array.from(byCategoryMap.values())
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const top_merchants: MerchantTotal[] = Array.from(byMerchantMap.values())
    .filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    month,
    owner: ownerName,
    total_expenses: totalExpenses,
    total_income: totalIncome,
    net_flow: totalIncome - totalExpenses,
    transaction_count: txs.length,
    by_category,
    top_merchants,
  };
}
