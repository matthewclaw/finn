import {
  findMerchantByName,
  findMerchantByAlias,
  createMerchant,
  addMerchantAlias,
  listMerchants,
  getMerchantById,
} from '../db/queries/merchants';
import type { Merchant } from '../types';

export async function resolveMerchant(
  name: string,
  defaultCategoryId?: string,
): Promise<Merchant> {
  const byAlias = await findMerchantByAlias(name.toLowerCase());
  if (byAlias) return byAlias;

  const byName = await findMerchantByName(name);
  if (byName) return byName;

  return createMerchant(name, [name.toLowerCase()], defaultCategoryId);
}

export async function mapAlias(alias: string, merchantName: string): Promise<Merchant> {
  const merchant = await findMerchantByName(merchantName);
  if (!merchant) throw new Error(`Merchant "${merchantName}" not found`);
  await addMerchantAlias(merchant.id, alias.toLowerCase());
  return { ...merchant, aliases: [...merchant.aliases, alias.toLowerCase()] };
}

export async function addMerchant(
  name: string,
  aliases: string[] = [],
  categoryName?: string,
): Promise<Merchant> {
  const existing = await findMerchantByName(name);
  if (existing) throw new Error(`Merchant "${name}" already exists`);

  let categoryId: string | undefined;
  if (categoryName) {
    const { resolveCategory } = await import('./categories');
    const cat = await resolveCategory(categoryName);
    categoryId = cat.id;
  }

  return createMerchant(name, aliases.map((a) => a.toLowerCase()), categoryId);
}

export { listMerchants, getMerchantById };
