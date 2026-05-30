import { db } from '../client';
import type { RecurringPattern } from '../../types';

export async function upsertRecurringPattern(
  data: Omit<RecurringPattern, 'id' | 'created_at'>,
): Promise<RecurringPattern> {
  const { data: pattern, error } = await db
    .from('recurring_patterns')
    .upsert(data, { onConflict: 'owner_id,description' })
    .select()
    .single();
  if (error) throw error;
  return pattern as RecurringPattern;
}

export async function listRecurringPatterns(ownerId?: string): Promise<RecurringPattern[]> {
  let q = db
    .from('recurring_patterns')
    .select('*')
    .eq('is_active', true)
    .order('description');
  if (ownerId) q = q.eq('owner_id', ownerId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as RecurringPattern[];
}

export async function markTransactionsRecurring(
  patternId: string,
  transactionIds: string[],
): Promise<void> {
  const { error } = await db
    .from('transactions')
    .update({ is_recurring: true, recurring_pattern_id: patternId })
    .in('id', transactionIds);
  if (error) throw error;
}
