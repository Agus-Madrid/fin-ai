import { Injectable } from '@nestjs/common';
import { PipelineContext } from '../pipeline-context.interface';
import { PipelineStage } from '../pipeline-stage.interface';

@Injectable()
export class IssueDescriptionStage implements PipelineStage {
  readonly name = 'issue-description';

  async executeStage(context: PipelineContext): Promise<PipelineContext> {
    const transactions = context.extractedTransactions ?? [];
    if (transactions.length === 0) {
      return context;
    }

    const invalidIndexes = this.readInvalidTransactionIndexes(context.warnings);
    if (invalidIndexes.size === 0) {
      return context;
    }

    const transactionsWithIssueDescription = transactions.map(
      (transaction, index) => {
        if (!invalidIndexes.has(index)) {
          return transaction;
        }

        return {
          ...transaction,
          description: this.addIssuePrefix(transaction.description),
        };
      },
    );

    return {
      ...context,
      extractedTransactions: transactionsWithIssueDescription,
    };
  }

  private readInvalidTransactionIndexes(warnings: string[]): Set<number> {
    const indexes = new Set<number>();
    const warningPattern = /TransactionValidationIssue\[index=(\d+)\]/;

    warnings.forEach((warning) => {
      const match = warning.match(warningPattern);
      if (!match) {
        return;
      }

      indexes.add(Number.parseInt(match[1], 10));
    });

    return indexes;
  }

  private addIssuePrefix(description: string | undefined): string {
    const baseDescription = description?.trim() ?? '';
    if (/^\(Issue\)/i.test(baseDescription)) {
      return baseDescription;
    }

    return baseDescription.length > 0
      ? `(Issue) ${baseDescription}`
      : '(Issue)';
  }
}
