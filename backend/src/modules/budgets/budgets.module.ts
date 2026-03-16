import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { Income } from '../incomes/incomes.entity';
import { SavingsLog } from '../savings-logs/savings-log.entity';
import { User } from '../user/user.entity';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Income, FixedCommitment, SavingsLog, User])],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
