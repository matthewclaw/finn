export interface Owner {
  id: string;
  name: string;
  email: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  color: string | null;
  icon: string | null;
  created_at: string;
}

export interface Merchant {
  id: string;
  name: string;
  aliases: string[];
  category_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  owner_id: string;
  date: string;
  amount: number;
  description: string;
  merchant_id: string | null;
  category_id: string | null;
  notes: string | null;
  tags: string[];
  import_batch_id: string | null;
  source: 'manual' | 'import' | 'recurring';
  is_recurring: boolean;
  recurring_pattern_id: string | null;
  dedup_hash: string;
  created_at: string;
  updated_at: string;
}

export interface ImportBatch {
  id: string;
  source: string;
  owner_id: string | null;
  raw_payload: unknown;
  imported_at: string;
  transaction_count: number;
  notes: string | null;
}

export interface RecurringPattern {
  id: string;
  owner_id: string;
  merchant_id: string | null;
  description: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'annual' | 'irregular';
  day_of_month: number | null;
  category_id: string | null;
  is_active: boolean;
  first_seen: string;
  last_seen: string;
  created_at: string;
}

export interface Budget {
  id: string;
  owner_id: string | null;
  category_id: string;
  month: string;
  amount: number;
  created_at: string;
}

// --- Input types ---

export interface AddTransactionInput {
  owner: string;
  date?: string;
  amount: number;
  description: string;
  category?: string;
  merchant?: string;
  notes?: string;
  tags?: string[];
}

export interface EditTransactionInput {
  date?: string;
  amount?: number;
  description?: string;
  category?: string;
  merchant?: string;
  notes?: string;
  tags?: string[];
}

export interface ImportTransactionRow {
  date: string;
  amount: number;
  description: string;
  merchant?: string;
  category?: string;
  notes?: string;
  tags?: string[];
}

export interface ImportPayload {
  owner: string;
  source: string;
  notes?: string;
  transactions: ImportTransactionRow[];
}

export interface TransactionQuery {
  owner?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  category?: string;
  merchant?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// --- View / output types ---

export interface TransactionView extends Transaction {
  owner_name: string;
  category_name: string | null;
  merchant_name: string | null;
}

export interface CategoryTotal {
  category_id: string | null;
  category_name: string | null;
  total: number;
  count: number;
}

export interface MerchantTotal {
  merchant_id: string | null;
  merchant_name: string | null;
  total: number;
  count: number;
}

export interface MonthlySummary {
  month: string;
  owner: string | null;
  total_expenses: number;
  total_income: number;
  net_flow: number;
  transaction_count: number;
  by_category: CategoryTotal[];
  top_merchants: MerchantTotal[];
}

export interface MonthComparison {
  category_name: string | null;
  current_total: number;
  previous_total: number;
  delta: number;
  delta_pct: number;
}

export interface ImportResult {
  batch_id: string;
  inserted: number;
  skipped: number;
  errors: string[];
}

export interface BudgetStatus {
  category_id: string;
  category_name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  pct_used: number;
}

export interface RecurringCandidate {
  description: string;
  merchant_id: string | null;
  owner_id: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'annual';
  day_of_month: number | null;
  category_id: string | null;
  first_seen: string;
  last_seen: string;
  occurrences: number;
}
