export class CreateSavingGoalDto {
  name: string;
  targetAmount: number;
  deadline: Date | string;
  priority?: number;
  userId: string;
}
