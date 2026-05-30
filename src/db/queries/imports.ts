import { db } from '../client';
import type { ImportBatch } from '../../types';

export async function createImportBatch(data: {
  source: string;
  owner_id: string | null;
  raw_payload: unknown;
  transaction_count: number;
  notes?: string;
}): Promise<ImportBatch> {
  const { data: batch, error } = await db
    .from('import_batches')
    .insert({
      source: data.source,
      owner_id: data.owner_id,
      raw_payload: data.raw_payload,
      transaction_count: data.transaction_count,
      notes: data.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return batch as ImportBatch;
}

export async function listImportBatches(ownerId?: string): Promise<ImportBatch[]> {
  let q = db.from('import_batches').select('*').order('imported_at', { ascending: false });
  if (ownerId) q = q.eq('owner_id', ownerId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ImportBatch[];
}
