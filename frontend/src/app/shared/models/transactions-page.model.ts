import { Transaction } from './transaction.model';

export interface TransactionsFilters {
  dateRange: string;
  account: string;
  search: string;
}

export interface TransactionsVm {
  currency: string;
  periodLabel: string;
  filters: TransactionsFilters;
  transactions: Transaction[];
  totalCount: number;
  rangeLabel: string;
  highlightedId?: string;
}
