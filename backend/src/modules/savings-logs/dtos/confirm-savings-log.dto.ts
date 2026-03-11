import { SavingsLogStatus } from '../savings-log-status.enum';

export class ConfirmSavingsLogDto {
  period: string;
  confirmedAmount?: number;
  status?: SavingsLogStatus;
}
