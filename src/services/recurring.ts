import { queryTransactions } from '../db/queries/transactions';
import {
  upsertRecurringPattern,
  listRecurringPatterns,
  markTransactionsRecurring,
} from '../db/queries/recurring';
import { resolveOwner } from './owners';
import { daysBetween } from '../utils/date';
import type { RecurringCandidate, RecurringPattern, Transaction } from '../types';

export async function detectRecurring(ownerName: string): Promise<RecurringCandidate[]> {
  const owner = await resolveOwner(ownerName);

  const txs = await queryTransactions({ owner: owner.id, limit: 10000 });

  const groups = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = normalizeKey(tx);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const candidates: RecurringCandidate[] = [];

  for (const txGroup of groups.values()) {
    if (txGroup.length < 2) continue;

    const sorted = [...txGroup].sort((a, b) => a.date.localeCompare(b.date));

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetween(sorted[i - 1].date, sorted[i].date));
    }

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((a, b) => a + Math.abs(b - avgGap), 0) / gaps.length;

    if (variance > avgGap * 0.35) continue;

    let frequency: 'monthly' | 'weekly' | 'annual' | null = null;
    if (avgGap >= 28 && avgGap <= 35) frequency = 'monthly';
    else if (avgGap >= 6 && avgGap <= 8) frequency = 'weekly';
    else if (avgGap >= 355 && avgGap <= 375) frequency = 'annual';

    if (!frequency) continue;

    const last = sorted[sorted.length - 1];
    const dayOfMonth =
      frequency === 'monthly'
        ? parseInt(last.date.split('-')[2], 10)
        : null;

    candidates.push({
      description: sorted[0].description,
      merchant_id: sorted[0].merchant_id,
      owner_id: owner.id,
      amount: sorted[0].amount,
      frequency,
      day_of_month: dayOfMonth,
      category_id: sorted[0].category_id,
      first_seen: sorted[0].date,
      last_seen: last.date,
      occurrences: sorted.length,
    });
  }

  return candidates;
}

export async function saveRecurringPatterns(
  candidates: RecurringCandidate[],
  transactionGroups: Map<string, Transaction[]>,
): Promise<RecurringPattern[]> {
  const saved: RecurringPattern[] = [];

  for (const candidate of candidates) {
    const pattern = await upsertRecurringPattern({
      owner_id: candidate.owner_id,
      merchant_id: candidate.merchant_id,
      description: candidate.description,
      amount: candidate.amount,
      frequency: candidate.frequency,
      day_of_month: candidate.day_of_month,
      category_id: candidate.category_id,
      is_active: true,
      first_seen: candidate.first_seen,
      last_seen: candidate.last_seen,
    });

    const txIds = (transactionGroups.get(normalizeDesc(candidate.description)) ?? []).map(
      (t) => t.id,
    );
    if (txIds.length > 0) {
      await markTransactionsRecurring(pattern.id, txIds);
    }

    saved.push(pattern);
  }

  return saved;
}

export async function listRecurring(ownerName?: string): Promise<RecurringPattern[]> {
  let ownerId: string | undefined;
  if (ownerName) {
    const owner = await resolveOwner(ownerName);
    ownerId = owner.id;
  }
  return listRecurringPatterns(ownerId);
}

function normalizeDesc(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeKey(tx: Transaction): string {
  return tx.merchant_id
    ? `merchant:${tx.merchant_id}:${Math.round(tx.amount)}`
    : `desc:${normalizeDesc(tx.description)}:${Math.round(tx.amount)}`;
}
