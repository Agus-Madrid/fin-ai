import { Injectable } from '@nestjs/common';
import { ExtractedTransaction } from '../../../../core/ai/interfaces';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class ValidationNormalizationStage implements PipelineStage {
  readonly name = 'validation-normalization';
  private readonly supportedCurrencies = ['USD', 'EUR', 'UYU'];

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const transactions = context.extractedTransactions ?? [];
    if (transactions.length === 0) {
      return context;
    }

    const normalizedTransactions = this.normalizeTransactions(transactions);
    const warnings = this.validateTransactions(normalizedTransactions, context);

    return {
      ...context,
      warnings,
      extractedTransactions: normalizedTransactions,
    };
  }

  private normalizeTransactions(
    transactions: ExtractedTransaction[],
  ): ExtractedTransaction[] {
    return transactions.map((transaction) =>
      this.normalizeTransaction(transaction),
    );
  }

  private normalizeTransaction(
    transaction: ExtractedTransaction,
  ): ExtractedTransaction {
    return {
      ...transaction,
      date: (transaction.date ?? '').trim(),
      merchant: (transaction.merchant ?? '').trim(),
      currency: (transaction.currency ?? '').trim().toUpperCase(),
      description: transaction.description?.trim() || undefined,
      category: transaction.category?.trim() || 'Sin categoria',
      amount: this.roundToTwoDecimals(transaction.amount),
    };
  }

  private validateTransactions(
    transactions: ExtractedTransaction[],
    context: PipelineContext,
  ): string[] {
    const warnings = [...context.warnings];

    transactions.forEach((transaction, index) => {
      const errors = this.validateTransaction(transaction);
      if (errors.length === 0) {
        return;
      }

      warnings.push(this.formatTransactionValidationWarning(index, errors));
    });

    return warnings;
  }

  private validateTransaction(transaction: ExtractedTransaction): string[] {
    const errors: string[] = [];

    if (!transaction.date) {
      errors.push('Missing required field: date');
    } else if (!this.isValidIsoDate(transaction.date)) {
      errors.push(`Invalid date format: ${transaction.date}`);
    }

    if (!transaction.merchant) {
      errors.push('Missing required field: merchant');
    }

    if (!transaction.currency) {
      errors.push('Missing required field: currency');
    } else if (!this.supportedCurrencies.includes(transaction.currency)) {
      errors.push(`Unsupported currency: ${transaction.currency}`);
    }

    if (
      transaction.amount === undefined ||
      transaction.amount === null ||
      !Number.isFinite(transaction.amount) ||
      transaction.amount <= 0
    ) {
      errors.push('Missing required field: amount');
    }

    return errors;
  }

  private roundToTwoDecimals(amount: number): number {
    if (!Number.isFinite(amount)) {
      return amount;
    }

    return Math.round(amount * 100) / 100;
  }

  private isValidIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day
    );
  }

  private formatTransactionValidationWarning(
    index: number,
    errors: string[],
  ): string {
    return `TransactionValidationIssue[index=${index}]: ${errors.join(', ')}`;
  }
}
