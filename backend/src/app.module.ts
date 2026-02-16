import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { ReviewInboxModule } from './modules/review-inbox/review-inbox.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USER ?? 'finai',
      password: process.env.DB_PASSWORD ?? 'finai',
      database: process.env.DB_NAME ?? 'finai',
      autoLoadEntities: true,
      synchronize: true,
    }),
    CoreModule,
    TransactionsModule,
    IngestionModule,
    ReviewInboxModule,
    UploadsModule,
    BudgetsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
