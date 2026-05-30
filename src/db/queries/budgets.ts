import { db } from '../client';
import type { Budget } from '../../types';

export async function upsertBudget(data: {
  owner_id: string | null;
  category_id: string;
  month: string;
  amount: number;
}): Promise<Budget> {
  const { data: budget, error } = await db
    .from('budgets')
    .upsert(data, { onConflict: 'owner_id,category_id,month' })
    .select()
    .single();
  if (error) throw error;
  return budget as Budget;
}

export async function getBudgetsForMonth(
  month: string,
  ownerId?: string | null,
): Promise<Budget[]> {
  let q = db.from('budgets').select('*').eq('month', `${month}-01`);
  if (ownerId !== undefined) {
    q = ownerId ? q.eq('owner_id', ownerId) : q.is('owner_id', null);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Budget[];
}
