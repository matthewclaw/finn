import { Command } from 'commander';
import { monthlySummary, compareToLastMonth, spendingTrends } from '../../services/summary';
import { out, err, printSummary } from '../output';
import { currentMonth, isValidMonth } from '../../utils/date';

export function registerReportCommands(program: Command): void {
  const report = program.command('report').description('Financial reports');

  report
    .command('monthly')
    .description('Monthly income/expense summary')
    .option('--owner <name>', 'Owner name')
    .option('--month <YYYY-MM>', 'Month (default: current)', currentMonth())
    .action(async (opts) => {
      try {
        if (!isValidMonth(opts.month)) err(`Invalid month: ${opts.month}`);
        const summary = await monthlySummary(opts.month, opts.owner);
        printSummary(summary);
        if (!process.stdout.isTTY) out(summary);
      } catch (e) {
        err(e);
      }
    });

  report
    .command('compare')
    .description('Compare current month to previous month')
    .option('--owner <name>', 'Owner name')
    .option('--month <YYYY-MM>', 'Month to compare (default: current)', currentMonth())
    .action(async (opts) => {
      try {
        if (!isValidMonth(opts.month)) err(`Invalid month: ${opts.month}`);
        const result = await compareToLastMonth(opts.month, opts.owner);

        if (!process.stdout.isTTY) return out(result);

        printSummary(result.current);
        console.log('=== Category Changes vs Previous Month ===\n');
        for (const c of result.comparison) {
          const name = (c.category_name ?? 'Uncategorised').padEnd(22);
          const sign = c.delta >= 0 ? '+' : '-';
          const color = c.delta > 0 ? '\x1b[31m' : '\x1b[32m';
          console.log(
            `  ${name} ${color}${sign}R${Math.abs(c.delta).toFixed(2).padStart(10)}\x1b[0m  (${c.delta_pct >= 0 ? '+' : ''}${c.delta_pct.toFixed(1)}%)`,
          );
        }
        console.log('');
      } catch (e) {
        err(e);
      }
    });

  report
    .command('trends')
    .description('Multi-month spending trends')
    .option('--owner <name>', 'Owner name')
    .option('--months <n>', 'Number of months', parseInt, 3)
    .action(async (opts) => {
      try {
        const trends = await spendingTrends(opts.months, opts.owner);

        if (!process.stdout.isTTY) return out(trends);

        console.log('\n=== Spending Trends ===\n');
        for (const s of trends) {
          const owner = s.owner ? ` (${s.owner})` : '';
          console.log(
            `  ${s.month}${owner}  Expenses: R${s.total_expenses.toFixed(2)}  Income: R${s.total_income.toFixed(2)}  Net: ${s.net_flow >= 0 ? '+' : ''}R${s.net_flow.toFixed(2)}`,
          );
        }
        console.log('');
      } catch (e) {
        err(e);
      }
    });
}
