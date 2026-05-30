import { Command } from 'commander';
import { addMerchant, mapAlias, listMerchants } from '../../services/merchants';
import { out, err } from '../output';
import { printTable } from '../../utils/format';

export function registerMerchantCommands(program: Command): void {
  const m = program.command('merchants').alias('mer').description('Manage merchants');

  m.command('list')
    .description('List all merchants')
    .action(async () => {
      try {
        const list = await listMerchants();
        if (!process.stdout.isTTY) return out(list);
        if (list.length === 0) { console.log('No merchants found.'); return; }
        printTable(
          ['Name', 'Aliases', 'ID'],
          list.map((m) => [m.name, m.aliases.join(', '), m.id]),
        );
      } catch (e) {
        err(e);
      }
    });

  m.command('add')
    .description('Add a merchant')
    .requiredOption('--name <name>', 'Merchant name')
    .option('--aliases <aliases>', 'Comma-separated aliases')
    .option('--category <name>', 'Default category')
    .action(async (opts) => {
      try {
        const aliases = opts.aliases ? opts.aliases.split(',').map((a: string) => a.trim()) : [];
        const merchant = await addMerchant(opts.name, aliases, opts.category);
        out(merchant);
      } catch (e) {
        err(e);
      }
    });

  m.command('map')
    .description('Map an alias to an existing merchant')
    .requiredOption('--alias <alias>', 'Raw alias string to map')
    .requiredOption('--merchant <name>', 'Target merchant name')
    .action(async (opts) => {
      try {
        const merchant = await mapAlias(opts.alias, opts.merchant);
        out(merchant);
      } catch (e) {
        err(e);
      }
    });
}
