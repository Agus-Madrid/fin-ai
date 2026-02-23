import { Module } from '@nestjs/common';
import { FixedCommitmentsController } from './fixed-commitments.controller';
import { FixedCommitmentsService } from './fixed-commitments.service';

@Module({
  controllers: [FixedCommitmentsController],
  providers: [FixedCommitmentsService],
})
export class FixedCommitmentsModule {}
