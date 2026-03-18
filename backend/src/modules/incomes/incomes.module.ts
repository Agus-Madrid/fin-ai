import { Module } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './incomes.entity';
import { User } from '../user/user.entity';
import { MonthlyFinancialsModule } from '../monthly-financials/monthly-financials.module';

@Module({
  imports: [TypeOrmModule.forFeature([Income, User]), MonthlyFinancialsModule],
  controllers: [IncomesController],
  providers: [IncomesService],
  exports: [IncomesService],
})
export class IncomesModule {}
