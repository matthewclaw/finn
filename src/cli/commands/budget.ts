import { Command } from 'commander';
import { setBudget, getBudgetStatus } from '../../services/budgets';
import { out, err, printBudgetStatus } from '../output';
import { currentMonth, isValidMonth } from '../../utils/date';

export function registerBudgetCommands(program: Command): void {
  const budget = program.command('budget').description('Manage budgets');

  budget
    .command('set')
    .description('Set a budget for a category and month')
    .option('--owner <name>', 'Owner (omit for shared/household budget)')
    .requiredOption('--category <name>', 'Category name')
    .requiredOption('--month <YYYY-MM>', 'Month')
    .requiredOption('--amount <amount>', 'Budget amount', parseFloat)
    .action(async (opts) => {
      try {
        if (!isValidMonth(opts.month)) err(`Invalid month: ${opts.month}`);
        await setBudget(opts.owner ?? null, opts.category, opts.month, opts.amount);
        out({ ok: true, owner: opts.owner ?? null, category: opts.category, month: opts.month, amount: opts.amount });
      } catch (e) {
        err(e);
      }
    });

  budget
    .command('status')
    .description('Budget vs actual spending for a month')
    .option('--owner <name>', 'Owner name')
    .option('--month <YYYY-MM>', 'Month (default: current)', currentMonth())
    .action(async (opts) => {
      try {
        if (!isValidMonth(opts.month)) err(`Invalid month: ${opts.month}`);
        const statuses = await getBudgetStatus(opts.month, opts.owner);
        printBudgetStatus(statuses);
        if (!process.stdout.isTTY) out(statuses);
      } catch (e) {
        err(e);
      }
    });
}
