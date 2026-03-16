import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { Income } from '../incomes/incomes.entity';
import { SavingGoal } from '../savings-goals/saving-goal.entity';
import { SavingsLog } from '../savings-logs/savings-log.entity';
import { User } from '../user/user.entity';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Income,
      FixedCommitment,
      SavingsLog,
      SavingGoal,
      User,
    ]),
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
