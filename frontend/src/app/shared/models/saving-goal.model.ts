export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  deadline: Date | string;
  priority: number;
}
