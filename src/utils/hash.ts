import { createHash } from 'crypto';

export function computeDedupHash(
  ownerId: string,
  date: string,
  amount: number,
  description: string,
): string {
  const key = `${ownerId}:${date}:${amount}:${description.toLowerCase().trim()}`;
  return createHash('sha256').update(key).digest('hex');
}
