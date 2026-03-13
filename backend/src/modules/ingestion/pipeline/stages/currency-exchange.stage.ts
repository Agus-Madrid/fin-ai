import { Injectable } from '@nestjs/common';
import { ExtractedTransaction } from '../../../../core/ai/interfaces';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class CurrencyExchangeStage implements PipelineStage {
  readonly name = 'currency-exchange';
  private readonly targetCurrency = 'UYU';
  private readonly exchangeRates: Record<string, number> = {
    USD: 40.38,
    EUR: 46.07,
  };

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const transactions = context.extractedTransactions ?? [];
    if (transactions.length === 0) {
      return context;
    }

    const warnings = [...context.warnings];
    const convertedTransactions = transactions.map((transaction, index) =>
      this.convertTransactionCurrency(transaction, index, warnings),
    );

    return {
      ...context,
      warnings,
      extractedTransactions: convertedTransactions,
    };
  }

  private convertTransactionCurrency(
    transaction: ExtractedTransaction,
    index: number,
    warnings: string[],
  ): ExtractedTransaction {
    if (!transaction.currency || transaction.currency === this.targetCurrency) {
      return transaction;
    }

    const rate = this.exchangeRates[transaction.currency];
    if (!rate) {
      warnings.push(
        `CurrencyExchangeIssue[index=${index}]: Unsupported source currency "${transaction.currency}".`,
      );
      return transaction;
    }

    return {
      ...transaction,
      amount: this.roundToTwoDecimals(transaction.amount * rate),
      currency: this.targetCurrency,
    };
  }

  private roundToTwoDecimals(amount: number): number {
    if (!Number.isFinite(amount)) {
      return amount;
    }

    return Math.round(amount * 100) / 100;
  }
}
