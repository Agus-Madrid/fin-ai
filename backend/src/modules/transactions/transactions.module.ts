import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../categories/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    UserModule,
    CategoryModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
