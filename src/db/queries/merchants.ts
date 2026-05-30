import { db } from '../client';
import type { Merchant } from '../../types';

export async function findMerchantByName(name: string): Promise<Merchant | null> {
  const { data, error } = await db
    .from('merchants')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
  if (error) throw error;
  return data as Merchant | null;
}

export async function findMerchantByAlias(alias: string): Promise<Merchant | null> {
  const { data, error } = await db
    .from('merchants')
    .select('*')
    .contains('aliases', [alias.toLowerCase()])
    .maybeSingle();
  if (error) throw error;
  return data as Merchant | null;
}

export async function createMerchant(
  name: string,
  aliases: string[] = [],
  categoryId?: string,
): Promise<Merchant> {
  const { data, error } = await db
    .from('merchants')
    .insert({ name, aliases, category_id: categoryId ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Merchant;
}

export async function addMerchantAlias(id: string, alias: string): Promise<void> {
  const { data: merchant, error: fetchErr } = await db
    .from('merchants')
    .select('aliases')
    .eq('id', id)
    .single();
  if (fetchErr) throw fetchErr;

  const updated = [...new Set([...(merchant.aliases as string[]), alias.toLowerCase()])];
  const { error } = await db.from('merchants').update({ aliases: updated }).eq('id', id);
  if (error) throw error;
}

export async function listMerchants(): Promise<Merchant[]> {
  const { data, error } = await db.from('merchants').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Merchant[];
}

export async function getMerchantById(id: string): Promise<Merchant | null> {
  const { data, error } = await db
    .from('merchants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Merchant | null;
}
