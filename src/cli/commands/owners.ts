import { Command } from 'commander';
import { listOwners, createOwner } from '../../services/owners';
import { out, err } from '../output';
import { printTable } from '../../utils/format';

export function registerOwnerCommands(program: Command): void {
  const owners = program.command('owners').description('Manage owners');

  owners
    .command('list')
    .description('List all owners')
    .action(async () => {
      try {
        const list = await listOwners();
        if (!process.stdout.isTTY) return out(list);
        if (list.length === 0) { console.log('No owners found.'); return; }
        printTable(['Name', 'Email', 'ID'], list.map((o) => [o.name, o.email ?? '-', o.id]));
      } catch (e) {
        err(e);
      }
    });

  owners
    .command('add')
    .description('Add an owner')
    .requiredOption('--name <name>', 'Owner name')
    .option('--email <email>', 'Email address')
    .action(async (opts) => {
      try {
        const owner = await createOwner(opts.name, opts.email);
        out(owner);
      } catch (e) {
        err(e);
      }
    });
}
