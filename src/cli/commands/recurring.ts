import { Command } from 'commander';
import { detectRecurring, listRecurring } from '../../services/recurring';
import { out, err, printRecurring } from '../output';

export function registerRecurringCommands(program: Command): void {
  const rec = program.command('recurring').alias('rec').description('Recurring payment detection');

  rec
    .command('list')
    .description('List known recurring patterns')
    .option('--owner <name>', 'Filter by owner')
    .action(async (opts) => {
      try {
        const patterns = await listRecurring(opts.owner);
        printRecurring(patterns);
        if (!process.stdout.isTTY) out(patterns);
      } catch (e) {
        err(e);
      }
    });

  rec
    .command('detect')
    .description('Scan transactions and detect recurring patterns')
    .requiredOption('--owner <name>', 'Owner to scan')
    .option('--save', 'Persist detected patterns to database')
    .action(async (opts) => {
      try {
        const candidates = await detectRecurring(opts.owner);

        if (!process.stdout.isTTY) return out(candidates);

        if (candidates.length === 0) {
          console.log('No recurring patterns detected.');
          return;
        }

        console.log(`\nDetected ${candidates.length} recurring pattern(s):\n`);
        for (const c of candidates) {
          console.log(
            `  ${c.description.padEnd(35)} ${c.frequency.padEnd(8)} ~R${c.amount.toFixed(2)}  (${c.occurrences}x, last: ${c.last_seen})`,
          );
        }
        console.log('');

        if (!opts.save) {
          console.log('Run with --save to persist these patterns.');
        }
      } catch (e) {
        err(e);
      }
    });
}
