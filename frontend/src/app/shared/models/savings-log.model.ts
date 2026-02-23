export type SavingsLogStatus = 'CONFIRMED' | 'SKIPPED';

export interface SavingsLog {
  id: string;
  period: string;
  status: SavingsLogStatus;
  monthlyGoalSnapshot: number;
  confirmedAmount: number;
  confirmedAt: Date | string | null;
  createdAt: Date | string;
}
