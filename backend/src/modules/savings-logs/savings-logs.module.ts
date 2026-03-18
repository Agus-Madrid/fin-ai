import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { SavingsLog } from './savings-log.entity';
import { SavingsLogsController } from './savings-logs.controller';
import { SavingsLogsService } from './savings-logs.service';
import { MonthlyFinancialsModule } from '../monthly-financials/monthly-financials.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavingsLog, User]),
    MonthlyFinancialsModule,
  ],
  controllers: [SavingsLogsController],
  providers: [SavingsLogsService],
  exports: [SavingsLogsService],
})
export class SavingsLogsModule {}
