import { IncomeRuleType } from './income.model';

export interface CreateIncomeRequest {
  name: string;
  description?: string;
  amount: number;
  ruleType?: IncomeRuleType;
  startPeriod?: string | null;
  targetPeriod?: string | null;
  isActive?: boolean;
}

export interface UpdateIncomeRequest {
  name?: string;
  description?: string;
  amount?: number;
  ruleType?: IncomeRuleType;
  startPeriod?: string | null;
  targetPeriod?: string | null;
  isActive?: boolean;
}
