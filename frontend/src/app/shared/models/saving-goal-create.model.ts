export interface CreateSavingGoalRequest {
  name: string;
  targetAmount: number;
  deadline: string;
  priority?: number;
}

export interface CreateSavingGoalDto extends CreateSavingGoalRequest {
  userId: string;
}

export interface UpdateSavingGoalRequest {
  name?: string;
  targetAmount?: number;
  deadline?: string;
  priority?: number;
}
