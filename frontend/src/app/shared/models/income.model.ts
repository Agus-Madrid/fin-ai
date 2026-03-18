import { User } from "./user.model";

export type IncomeRuleType = 'MONTHLY_RECURRING' | 'ONE_TIME';

export interface Income {
  id: string;
  name: string;
  description?: string;
  amount: number;
  ruleType: IncomeRuleType;
  startPeriod: string | null;
  targetPeriod: string | null;
  isActive: boolean;
  user?: User;
}
