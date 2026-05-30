import {
  findCategoryByName,
  createCategory,
  listCategories,
  getCategoryById,
} from '../db/queries/categories';
import type { Category } from '../types';

export async function resolveCategory(name: string): Promise<Category> {
  const existing = await findCategoryByName(name);
  if (existing) return existing;
  return createCategory(name);
}

export async function addCategory(name: string, parentName?: string): Promise<Category> {
  let parentId: string | undefined;
  if (parentName) {
    const parent = await findCategoryByName(parentName);
    if (!parent) throw new Error(`Parent category "${parentName}" not found`);
    parentId = parent.id;
  }
  const existing = await findCategoryByName(name);
  if (existing) throw new Error(`Category "${name}" already exists`);
  return createCategory(name, parentId);
}

export { listCategories, getCategoryById };
