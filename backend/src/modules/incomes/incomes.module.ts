import { Module } from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { IncomesController } from './incomes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Income } from './incomes.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Income, User])],
  controllers: [IncomesController],
  providers: [IncomesService],
  exports: [IncomesService],
})

export class IncomesModule {}
