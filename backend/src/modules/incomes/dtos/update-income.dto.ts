import { IncomeRuleType } from '../income-rule-type.enum';

export class UpdateIncomeDto {
  name?: string;
  description?: string;
  amount?: number;
  ruleType?: IncomeRuleType;
  startPeriod?: string | null;
  targetPeriod?: string | null;
  isActive?: boolean;
}
