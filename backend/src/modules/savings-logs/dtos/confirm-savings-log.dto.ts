import { SavingsLogStatus } from '../savings-log-status.enum';

export class ConfirmSavingsLogDto {
  userId: string;
  period: string;
  confirmedAmount?: number;
  status?: SavingsLogStatus;
}
