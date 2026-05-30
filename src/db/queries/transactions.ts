import { db } from '../client';
import type { Transaction, TransactionQuery } from '../../types';
import { monthBounds } from '../../utils/date';

type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;

export async function insertTransaction(data: TransactionInsert): Promise<Transaction> {
  const { data: tx, error } = await db
    .from('transactions')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return tx as Transaction;
}

export async function upsertTransaction(
  data: TransactionInsert,
): Promise<{ tx: Transaction; was_duplicate: boolean }> {
  const existing = await getTransactionByHash(data.dedup_hash);
  if (existing) return { tx: existing, was_duplicate: true };

  const { data: tx, error } = await db
    .from('transactions')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return { tx: tx as Transaction, was_duplicate: false };
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  const { data, error } = await db
    .from('transactions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Transaction | null;
}

export async function getTransactionByHash(hash: string): Promise<Transaction | null> {
  const { data, error } = await db
    .from('transactions')
    .select('*')
    .eq('dedup_hash', hash)
    .maybeSingle();
  if (error) throw error;
  return data as Transaction | null;
}

export async function updateTransaction(
  id: string,
  changes: Partial<TransactionInsert>,
): Promise<Transaction> {
  const { data, error } = await db
    .from('transactions')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function queryTransactions(opts: TransactionQuery): Promise<Transaction[]> {
  let q = db.from('transactions').select('*');

  if (opts.owner) {
    q = q.eq('owner_id', opts.owner);
  }
  if (opts.month) {
    const { start, end } = monthBounds(opts.month);
    q = q.gte('date', start).lte('date', end);
  } else {
    if (opts.startDate) q = q.gte('date', opts.startDate);
    if (opts.endDate) q = q.lte('date', opts.endDate);
  }
  if (opts.category) q = q.eq('category_id', opts.category);
  if (opts.merchant) q = q.eq('merchant_id', opts.merchant);
  if (opts.tags?.length) q = q.overlaps('tags', opts.tags);

  q = q.order('date', { ascending: false });

  if (opts.limit) q = q.limit(opts.limit);
  if (opts.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function getExistingHashes(hashes: string[]): Promise<Set<string>> {
  const { data, error } = await db
    .from('transactions')
    .select('dedup_hash')
    .in('dedup_hash', hashes);
  if (error) throw error;
  return new Set((data ?? []).map((r: { dedup_hash: string }) => r.dedup_hash));
}

export async function bulkInsertTransactions(
  rows: TransactionInsert[],
): Promise<Transaction[]> {
  const { data, error } = await db
    .from('transactions')
    .insert(rows)
    .select();
  if (error) throw error;
  return (data ?? []) as Transaction[];
}
