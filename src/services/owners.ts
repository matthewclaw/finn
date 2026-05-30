import { findOwnerByName, createOwner, listOwners } from '../db/queries/owners';
import type { Owner } from '../types';

export async function resolveOwner(name: string): Promise<Owner> {
  const existing = await findOwnerByName(name);
  if (existing) return existing;
  return createOwner(name);
}

export { listOwners };
export { createOwner };
