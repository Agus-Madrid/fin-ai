import { Transaction } from './transaction.model';

export interface TrendPoint {
  label: string;
  value: number;
}

export interface CategoryBreakdown {
  name: string;
  amount: number;
  color: string;
}

export interface DashboardVm {
  currency: string;
  monthLabel: string;
  spendableBalance: number;
  spendableDeltaPercent: number;
  incomeTotal: number;
  fixedExpenses: number;
  savingsTarget: number;
  savingsCurrent: number;
  savingsGoalLabel: string;
  savingsGoalTarget: number;
  weeklyBudgetUsed: number;
  weeklyBudgetTotal: number;
  trend: TrendPoint[];
  categories: CategoryBreakdown[];
  recentTransactions: Transaction[];
}
