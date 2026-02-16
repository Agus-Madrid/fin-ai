import { Module } from '@nestjs/common';
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
