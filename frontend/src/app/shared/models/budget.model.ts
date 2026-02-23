import { SavingGoal } from './saving-goal.model';

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
  goalName: string;
  goalId: string | null;
  monthlyGoal: number;
  monthlyGoalPercent: number;
  progress: number;
  projectedMessage: string;
  currentTotal: number;
  targetAmount: number;
  currentYear: number;
  currentPeriodLabel: string;
  currentPeriodStatus: 'PENDING' | 'CONFIRMED' | 'SKIPPED';
  currentPeriodConfirmedAmount: number;
  currentPeriodSuggestedAmount: number;
  annualConfirmedTotal: number;
  annualLogs: SavingsLogPoint[];
}

export interface CommitmentSummary {
  preCommitted: number;
  discretionary: number;
  preCommittedPercent: number;
  remainderPercent: number;
}

export interface SavingsLogPoint {
  monthIndex: number;
  monthLabel: string;
  confirmedAmount: number;
}

export interface SavingGoalProgress extends SavingGoal {
  allocatedAmount: number;
  progressPercent: number;
}

export interface BudgetViewModel {
  currency: string;
  incomeSources: IncomeSource[];
  fixedExpenses: FixedExpense[];
  savingGoals: SavingGoalProgress[];
  currentPeriodSavingGoals: SavingGoalProgress[];
  savings: SavingsTarget;
  commitments: CommitmentSummary;
  totalIncome: number;
  totalFixed: number;
}
