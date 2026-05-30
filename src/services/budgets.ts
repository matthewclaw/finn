import { upsertBudget, getBudgetsForMonth } from '../db/queries/budgets';
import { queryTransactions } from '../db/queries/transactions';
import { resolveOwner } from './owners';
import { resolveCategory } from './categories';
import { getCategoryById } from '../db/queries/categories';
import { monthBounds, currentMonth } from '../utils/date';
import type { BudgetStatus } from '../types';

export async function setBudget(
  ownerName: string | null,
  categoryName: string,
  month: string,
  amount: number,
): Promise<void> {
  let ownerId: string | null = null;
  if (ownerName) {
    const owner = await resolveOwner(ownerName);
    ownerId = owner.id;
  }

  const category = await resolveCategory(categoryName);

  await upsertBudget({
    owner_id: ownerId,
    category_id: category.id,
    month: `${month}-01`,
    amount,
  });
}

export async function getBudgetStatus(
  month: string,
  ownerName?: string,
): Promise<BudgetStatus[]> {
  let ownerId: string | undefined;
  if (ownerName) {
    const owner = await resolveOwner(ownerName);
    ownerId = owner.id;
  }

  const budgets = await getBudgetsForMonth(month, ownerId ?? null);
  if (budgets.length === 0) return [];

  const { start, end } = monthBounds(month);
  const txs = await queryTransactions({
    owner: ownerId,
    startDate: start,
    endDate: end,
    limit: 10000,
  });

  const spentByCategory = new Map<string, number>();
  for (const tx of txs) {
    if (tx.category_id && tx.amount > 0) {
      spentByCategory.set(
        tx.category_id,
        (spentByCategory.get(tx.category_id) ?? 0) + tx.amount,
      );
    }
  }

  const statuses: BudgetStatus[] = await Promise.all(
    budgets.map(async (b) => {
      const cat = await getCategoryById(b.category_id);
      const spent = spentByCategory.get(b.category_id) ?? 0;
      const remaining = b.amount - spent;
      const pct_used = b.amount === 0 ? 0 : (spent / b.amount) * 100;

      return {
        category_id: b.category_id,
        category_name: cat?.name ?? b.category_id,
        budgeted: b.amount,
        spent,
        remaining,
        pct_used,
      };
    }),
  );

  return statuses.sort((a, b) => b.pct_used - a.pct_used);
}

export { currentMonth };
