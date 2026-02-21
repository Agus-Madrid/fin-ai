import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/category.entity';
import { FixedCommitment } from '../fixed-commitments/fixed-commitment.entity';
import { SavingGoal } from '../savings-goals/saving-goal.entity';
import { Transaction } from '../transactions/transaction.entity';
import { Upload } from '../uploads/upload.entity';
import { User } from '../user/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction, Upload, SavingGoal, FixedCommitment, Category])],
  providers: [SeedService],
})
export class SeedModule {}
