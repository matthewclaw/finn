import { Command } from 'commander';
import * as fs from 'fs';
import { addTransaction, editTransaction, listTransactions } from '../../services/transactions';
import { importBatch } from '../../services/imports';
import {
  out,
  err,
  printTransactions,
  printImportResult,
} from '../output';
import { today, isValidDate, isValidMonth, monthBounds } from '../../utils/date';

export function registerTxCommands(program: Command): void {
  const tx = program.command('tx').description('Manage transactions');

  tx.command('add')
    .description('Add a single transaction')
    .requiredOption('--owner <name>', 'Owner (matthew / kaylee / shared)')
    .requiredOption('--amount <amount>', 'Amount (positive = expense)', parseFloat)
    .requiredOption('--description <text>', 'Description')
    .option('--date <date>', 'Date YYYY-MM-DD (default: today)', today())
    .option('--category <name>', 'Category name')
    .option('--merchant <name>', 'Merchant name')
    .option('--notes <text>', 'Notes')
    .option('--tags <tags>', 'Comma-separated tags')
    .action(async (opts) => {
      try {
        if (opts.date && !isValidDate(opts.date)) err(`Invalid date: ${opts.date}`);
        const result = await addTransaction({
          owner: opts.owner,
          date: opts.date,
          amount: opts.amount,
          description: opts.description,
          category: opts.category,
          merchant: opts.merchant,
          notes: opts.notes,
          tags: opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : undefined,
        });
        printTransactions([result]);
        if (!process.stdout.isTTY) out(result);
      } catch (e) {
        err(e);
      }
    });

  tx.command('list')
    .description('List transactions')
    .option('--owner <name>', 'Filter by owner')
    .option('--month <YYYY-MM>', 'Filter by month')
    .option('--start <date>', 'Start date YYYY-MM-DD')
    .option('--end <date>', 'End date YYYY-MM-DD')
    .option('--category <name>', 'Filter by category')
    .option('--merchant <name>', 'Filter by merchant')
    .option('--limit <n>', 'Max results', parseInt, 50)
    .action(async (opts) => {
      try {
        if (opts.month && !isValidMonth(opts.month)) err(`Invalid month: ${opts.month}`);

        let startDate = opts.start;
        let endDate = opts.end;
        if (opts.month && !startDate && !endDate) {
          const bounds = monthBounds(opts.month);
          startDate = bounds.start;
          endDate = bounds.end;
        }

        const txs = await listTransactions({
          owner: opts.owner,
          month: opts.month,
          startDate,
          endDate,
          category: opts.category,
          merchant: opts.merchant,
          limit: opts.limit,
        });
        printTransactions(txs);
      } catch (e) {
        err(e);
      }
    });

  tx.command('edit <id>')
    .description('Edit a transaction')
    .option('--date <date>', 'New date')
    .option('--amount <amount>', 'New amount', parseFloat)
    .option('--description <text>', 'New description')
    .option('--category <name>', 'New category')
    .option('--merchant <name>', 'New merchant')
    .option('--notes <text>', 'New notes')
    .option('--tags <tags>', 'New tags (comma-separated)')
    .action(async (id: string, opts) => {
      try {
        const result = await editTransaction(id, {
          date: opts.date,
          amount: opts.amount,
          description: opts.description,
          category: opts.category,
          merchant: opts.merchant,
          notes: opts.notes,
          tags: opts.tags ? opts.tags.split(',').map((t: string) => t.trim()) : undefined,
        });
        printTransactions([result]);
      } catch (e) {
        err(e);
      }
    });

  tx.command('import')
    .description('Import a batch of transactions from a JSON payload')
    .option('--file <path>', 'Path to JSON file')
    .option('--stdin', 'Read from stdin')
    .option('--payload <json>', 'Inline JSON payload')
    .option('--dry-run', 'Validate without saving')
    .action(async (opts) => {
      try {
        let raw: unknown;

        if (opts.file) {
          const content = fs.readFileSync(opts.file, 'utf8');
          raw = JSON.parse(content);
        } else if (opts.payload) {
          raw = JSON.parse(opts.payload);
        } else if (opts.stdin) {
          const chunks: Buffer[] = [];
          for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
          raw = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        } else {
          err('Provide --file, --payload, or --stdin');
        }

        if (opts.dryRun) {
          out({ message: 'Dry run — payload is valid', payload: raw });
          return;
        }

        const result = await importBatch(raw);
        printImportResult(result);
      } catch (e) {
        err(e);
      }
    });
}
