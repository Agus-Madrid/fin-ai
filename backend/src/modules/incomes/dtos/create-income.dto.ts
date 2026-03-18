import { IncomeRuleType } from '../income-rule-type.enum';

export class CreateIncomeDto {
  name: string;
  description?: string;
  amount: number;
  ruleType?: IncomeRuleType;
  startPeriod?: string | null;
  targetPeriod?: string | null;
  isActive?: boolean;
}
