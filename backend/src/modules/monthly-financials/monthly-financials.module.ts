import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { Income } from '../incomes/incomes.entity';
import { SavingsLog } from '../savings-logs/savings-log.entity';
import { User } from '../user/user.entity';
import { IncomeMonthEntry } from './income-month-entry.entity';
import { MonthlyFinancialsService } from './monthly-financials.service';
import { MonthlySummary } from './monthly-summary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Income,
      IncomeMonthEntry,
      MonthlySummary,
      FixedCommitment,
      SavingsLog,
      User,
    ]),
  ],
  providers: [MonthlyFinancialsService],
  exports: [MonthlyFinancialsService],
})
export class MonthlyFinancialsModule {}
