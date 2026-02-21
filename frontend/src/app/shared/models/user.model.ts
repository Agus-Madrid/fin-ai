import { SavingGoal } from './saving-goal.model';

export interface User {
  id: string;
  name: string;
  password: string;
  email: string;
  createdAt: Date | string;
  currentTotalSavings: number;
  savingGoals: SavingGoal[];
}
