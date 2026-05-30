#!/usr/bin/env node
import { Command } from 'commander';
import { registerTxCommands } from './commands/tx';
import { registerReportCommands } from './commands/report';
import { registerBudgetCommands } from './commands/budget';
import { registerCategoryCommands } from './commands/categories';
import { registerMerchantCommands } from './commands/merchants';
import { registerRecurringCommands } from './commands/recurring';
import { registerOwnerCommands } from './commands/owners';

const program = new Command();

program
  .name('finn')
  .description('Personal finance CLI — structured memory for your money')
  .version('0.1.0');

registerTxCommands(program);
registerReportCommands(program);
registerBudgetCommands(program);
registerCategoryCommands(program);
registerMerchantCommands(program);
registerRecurringCommands(program);
registerOwnerCommands(program);

program.parse(process.argv);
