import { Command } from 'commander';
import { addCategory, listCategories } from '../../services/categories';
import { out, err } from '../output';
import { printTable } from '../../utils/format';

export function registerCategoryCommands(program: Command): void {
  const cats = program.command('categories').alias('cat').description('Manage categories');

  cats
    .command('list')
    .description('List all categories')
    .action(async () => {
      try {
        const list = await listCategories();
        if (!process.stdout.isTTY) return out(list);
        if (list.length === 0) { console.log('No categories found.'); return; }
        printTable(
          ['Name', 'ID'],
          list.map((c) => [c.name, c.id]),
        );
      } catch (e) {
        err(e);
      }
    });

  cats
    .command('add')
    .description('Add a category')
    .requiredOption('--name <name>', 'Category name')
    .option('--parent <name>', 'Parent category name')
    .action(async (opts) => {
      try {
        const cat = await addCategory(opts.name, opts.parent);
        out(cat);
      } catch (e) {
        err(e);
      }
    });
}
