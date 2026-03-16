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
  currentPeriodPlannedAmount: number;
  currentPeriodConfirmedAmount: number;
  currentPeriodShortfallAmount: number;
  currentPeriodSuggestedAmount: number;
  discipline: SavingsDiscipline;
  alerts: SavingsAlert[];
  annualConfirmedTotal: number;
  annualLogs: SavingsLogPoint[];
}

export type SavingsAlertTone = 'INFO' | 'WARNING' | 'CRITICAL';

export interface SavingsAlert {
  id: string;
  tone: SavingsAlertTone;
  message: string;
}

export interface SavingsDiscipline {
  score: number;
  evaluatedMonths: number;
  metMonths: number;
  partialMonths: number;
  skippedMonths: number;
  targetHitStreak: number;
}

export interface CommitmentSummary {
  preCommitted: number;
  discretionary: number;
  preCommittedPercent: number;
  remainderPercent: number;
  savingsCommittedAmount: number;
  savingsCommittedType: 'PENDING' | 'CONFIRMED' | 'SKIPPED';
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
