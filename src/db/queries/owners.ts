import { db } from '../client';
import type { Owner } from '../../types';

export async function findOwnerByName(name: string): Promise<Owner | null> {
  const { data, error } = await db
    .from('owners')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
  if (error) throw error;
  return data as Owner | null;
}

export async function createOwner(name: string, email?: string): Promise<Owner> {
  const { data, error } = await db
    .from('owners')
    .insert({ name, email: email ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Owner;
}

export async function listOwners(): Promise<Owner[]> {
  const { data, error } = await db.from('owners').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Owner[];
}
