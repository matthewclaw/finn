import { db } from '../client';
import type { Category } from '../../types';

export async function findCategoryByName(name: string): Promise<Category | null> {
  const { data, error } = await db
    .from('categories')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
  if (error) throw error;
  return data as Category | null;
}

export async function createCategory(
  name: string,
  parentId?: string,
): Promise<Category> {
  const { data, error } = await db
    .from('categories')
    .insert({ name, parent_id: parentId ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await db.from('categories').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await db
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Category | null;
}
