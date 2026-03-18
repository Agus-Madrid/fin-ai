import { Module } from '@nestjs/common';
import { FixedCommitmentsController } from './fixed-commitments.controller';
import { FixedCommitmentsService } from './fixed-commitments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedCommitment } from './fixed-commitment.entity';
import { User } from '../user/user.entity';
import { MonthlyFinancialsModule } from '../monthly-financials/monthly-financials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FixedCommitment, User]),
    MonthlyFinancialsModule,
  ],
  controllers: [FixedCommitmentsController],
  providers: [FixedCommitmentsService],
})
export class FixedCommitmentsModule {}
