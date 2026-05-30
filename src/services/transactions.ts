import {
  insertTransaction,
  getTransactionById,
  updateTransaction,
  queryTransactions,
} from '../db/queries/transactions';
import { resolveOwner } from './owners';
import { resolveCategory, getCategoryById } from './categories';
import { resolveMerchant, getMerchantById } from './merchants';
import { computeDedupHash } from '../utils/hash';
import { today, isValidDate } from '../utils/date';
import type {
  AddTransactionInput,
  EditTransactionInput,
  Transaction,
  TransactionView,
  TransactionQuery,
} from '../types';

export async function addTransaction(input: AddTransactionInput): Promise<TransactionView> {
  if (!input.description?.trim()) throw new Error('description is required');
  if (typeof input.amount !== 'number') throw new Error('amount must be a number');

  const date = input.date ?? today();
  if (!isValidDate(date)) throw new Error(`Invalid date: ${date}`);

  const owner = await resolveOwner(input.owner);

  let categoryId: string | null = null;
  if (input.category) {
    const cat = await resolveCategory(input.category);
    categoryId = cat.id;
  }

  let merchantId: string | null = null;
  if (input.merchant) {
    const merchant = await resolveMerchant(input.merchant, categoryId ?? undefined);
    merchantId = merchant.id;
    if (!categoryId && merchant.category_id) categoryId = merchant.category_id;
  }

  const hash = computeDedupHash(owner.id, date, input.amount, input.description);

  const tx = await insertTransaction({
    owner_id: owner.id,
    date,
    amount: input.amount,
    description: input.description.trim(),
    merchant_id: merchantId,
    category_id: categoryId,
    notes: input.notes ?? null,
    tags: input.tags ?? [],
    import_batch_id: null,
    source: 'manual',
    is_recurring: false,
    recurring_pattern_id: null,
    dedup_hash: hash,
  });

  return enrichTransaction(tx, owner.name, categoryId, merchantId);
}

export async function editTransaction(
  id: string,
  changes: EditTransactionInput,
): Promise<TransactionView> {
  const existing = await getTransactionById(id);
  if (!existing) throw new Error(`Transaction ${id} not found`);

  const updates: Partial<Transaction> = {};

  if (changes.date !== undefined) {
    if (!isValidDate(changes.date)) throw new Error(`Invalid date: ${changes.date}`);
    updates.date = changes.date;
  }
  if (changes.amount !== undefined) updates.amount = changes.amount;
  if (changes.description !== undefined) updates.description = changes.description.trim();
  if (changes.notes !== undefined) updates.notes = changes.notes;
  if (changes.tags !== undefined) updates.tags = changes.tags;

  if (changes.category !== undefined) {
    const cat = await resolveCategory(changes.category);
    updates.category_id = cat.id;
  }
  if (changes.merchant !== undefined) {
    const m = await resolveMerchant(changes.merchant);
    updates.merchant_id = m.id;
  }

  if (Object.keys(updates).length === 0) throw new Error('No changes provided');

  const newDate = updates.date ?? existing.date;
  const newAmount = updates.amount ?? existing.amount;
  const newDesc = updates.description ?? existing.description;
  updates.dedup_hash = computeDedupHash(existing.owner_id, newDate, newAmount, newDesc);

  const tx = await updateTransaction(id, updates);
  const catId = tx.category_id;
  const merId = tx.merchant_id;
  const owner = await resolveOwner(existing.owner_id);
  return enrichTransaction(tx, owner.name, catId, merId);
}

export async function listTransactions(query: TransactionQuery): Promise<TransactionView[]> {
  let ownerId: string | undefined;
  if (query.owner) {
    const owner = await resolveOwner(query.owner);
    ownerId = owner.id;
  }

  let categoryId: string | undefined;
  if (query.category) {
    const cat = await resolveCategory(query.category);
    categoryId = cat.id;
  }

  let merchantId: string | undefined;
  if (query.merchant) {
    const m = await resolveMerchant(query.merchant);
    merchantId = m.id;
  }

  const txs = await queryTransactions({
    ...query,
    owner: ownerId,
    category: categoryId,
    merchant: merchantId,
    limit: query.limit ?? 50,
  });

  return Promise.all(
    txs.map((tx) => enrichTransaction(tx, undefined, tx.category_id, tx.merchant_id)),
  );
}

async function enrichTransaction(
  tx: Transaction,
  ownerName: string | undefined,
  categoryId: string | null,
  merchantId: string | null,
): Promise<TransactionView> {
  const [cat, merchant] = await Promise.all([
    categoryId ? getCategoryById(categoryId) : Promise.resolve(null),
    merchantId ? getMerchantById(merchantId) : Promise.resolve(null),
  ]);

  return {
    ...tx,
    owner_name: ownerName ?? tx.owner_id,
    category_name: cat?.name ?? null,
    merchant_name: merchant?.name ?? null,
  };
}
