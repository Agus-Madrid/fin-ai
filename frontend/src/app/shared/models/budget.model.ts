export interface IncomeSource {
  id: string;
  label: string;
  source: string;
  amount: number;
  status: string;
  timing: string;
  progress: number;
}

export interface FixedExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  progress: number;
  icon: string;
}

export interface SavingsTarget {
  monthlyGoal: number;
  progress: number;
  projectedMessage: string;
}

export interface CommitmentSummary {
  preCommitted: number;
  discretionary: number;
  remainderPercent: number;
}

export interface BudgetVm {
  currency: string;
  incomeSources: IncomeSource[];
  fixedExpenses: FixedExpense[];
  savings: SavingsTarget;
  commitments: CommitmentSummary;
  totalIncome: number;
  totalFixed: number;
}
