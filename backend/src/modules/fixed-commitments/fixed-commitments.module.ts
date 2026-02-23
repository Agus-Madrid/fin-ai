import { Module } from '@nestjs/common';
import { FixedCommitmentsController } from './fixed-commitments.controller';
import { FixedCommitmentsService } from './fixed-commitments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FixedCommitment } from './fixed-commitment.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FixedCommitment, User])],
  controllers: [FixedCommitmentsController],
  providers: [FixedCommitmentsService],
})
export class FixedCommitmentsModule {}
