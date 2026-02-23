import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { SavingGoalController } from './saving-goal.controller';
import { SavingGoal } from './saving-goal.entity';
import { SavingGoalService } from './saving-goal.service';

@Module({
  imports: [TypeOrmModule.forFeature([SavingGoal, User])],
  controllers: [SavingGoalController],
  providers: [SavingGoalService],
  exports: [SavingGoalService],
})
export class SavingsGoalsModule {}
