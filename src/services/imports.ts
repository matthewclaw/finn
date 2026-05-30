import { z } from 'zod';
import { resolveOwner } from './owners';
import { resolveCategory } from './categories';
import { resolveMerchant } from './merchants';
import { computeDedupHash } from '../utils/hash';
import { isValidDate } from '../utils/date';
import { createImportBatch } from '../db/queries/imports';
import { getExistingHashes, bulkInsertTransactions } from '../db/queries/transactions';
import type { ImportPayload, ImportResult } from '../types';

const ImportRowSchema = z.object({
  date: z.string().refine(isValidDate, { message: 'Invalid date (expected YYYY-MM-DD)' }),
  amount: z.number(),
  description: z.string().min(1),
  merchant: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const ImportPayloadSchema = z.object({
  owner: z.string().min(1),
  source: z.string().min(1),
  notes: z.string().optional(),
  transactions: z.array(ImportRowSchema).min(1),
});

export async function importBatch(raw: unknown): Promise<ImportResult> {
  const payload = ImportPayloadSchema.parse(raw) as ImportPayload;

  const owner = await resolveOwner(payload.owner);

  const batch = await createImportBatch({
    source: payload.source,
    owner_id: owner.id,
    raw_payload: raw,
    transaction_count: payload.transactions.length,
    notes: payload.notes,
  });

  const hashes = payload.transactions.map((row) =>
    computeDedupHash(owner.id, row.date, row.amount, row.description),
  );

  const existingHashes = await getExistingHashes(hashes);

  const errors: string[] = [];
  const toInsert: Parameters<typeof bulkInsertTransactions>[0] = [];

  for (let i = 0; i < payload.transactions.length; i++) {
    const row = payload.transactions[i];
    const hash = hashes[i];

    if (existingHashes.has(hash)) continue;

    try {
      let categoryId: string | null = null;
      if (row.category) {
        const cat = await resolveCategory(row.category);
        categoryId = cat.id;
      }

      let merchantId: string | null = null;
      if (row.merchant) {
        const m = await resolveMerchant(row.merchant, categoryId ?? undefined);
        merchantId = m.id;
        if (!categoryId && m.category_id) categoryId = m.category_id;
      }

      toInsert.push({
        owner_id: owner.id,
        date: row.date,
        amount: row.amount,
        description: row.description.trim(),
        merchant_id: merchantId,
        category_id: categoryId,
        notes: row.notes ?? null,
        tags: row.tags ?? [],
        import_batch_id: batch.id,
        source: 'import',
        is_recurring: false,
        recurring_pattern_id: null,
        dedup_hash: hash,
      });
    } catch (err) {
      errors.push(`Row ${i + 1} (${row.description}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  let inserted = 0;
  if (toInsert.length > 0) {
    const result = await bulkInsertTransactions(toInsert);
    inserted = result.length;
  }

  return {
    batch_id: batch.id,
    inserted,
    skipped: existingHashes.size,
    errors,
  };
}
