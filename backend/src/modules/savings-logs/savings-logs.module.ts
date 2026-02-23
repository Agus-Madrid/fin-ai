import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { SavingsLog } from './savings-log.entity';
import { SavingsLogsController } from './savings-logs.controller';
import { SavingsLogsService } from './savings-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([SavingsLog, User])],
  controllers: [SavingsLogsController],
  providers: [SavingsLogsService],
  exports: [SavingsLogsService],
})
export class SavingsLogsModule {}
