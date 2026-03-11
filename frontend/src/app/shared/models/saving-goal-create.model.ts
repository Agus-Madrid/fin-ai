export interface CreateSavingGoalRequest {
  name: string;
  targetAmount: number;
  deadline: string;
  priority?: number;
}

export interface UpdateSavingGoalRequest {
  name?: string;
  targetAmount?: number;
  deadline?: string;
  priority?: number;
}
