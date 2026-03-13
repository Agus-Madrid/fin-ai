import { Injectable } from "@nestjs/common";
import { PipelineStage } from "../pipeline-stage.interface";
import { PipelineContext } from "../pipeline-context.interface";
import { ExtractedTransaction } from "src/core/ai/interfaces";

@Injectable()
export class ValidationNormalizationStage implements PipelineStage {
    readonly name = "validation-normalization";
    readonly supportedCurrencies = ["USD", "EUR", "UYU"];
    readonly actualTargetCurrency = this.supportedCurrencies[2]; 

    async executeStage(context: PipelineContext): Promise<PipelineContext> {
        const warnings = [...context.warnings];

        if (!context.extractedText) {
            warnings.push("No extracted text available for validation and normalization.");
            return {
                ...context,
                warnings,
            };
        }

        this.normalizeFromExtracted(context.extractedTransactions);
        const { validTransactions, invalidTransactions } = this.splitValidAndInvalidTransactions(context.extractedTransactions);
        this.pushInvalidTransactionWarnings(invalidTransactions, warnings);

        return {
            ...context,
            warnings,
            extractedTransactions: validTransactions,
        };
    }

    private pushInvalidTransactionWarnings(
        invalidTransactions: { index: number; errors: string[] }[],
        warnings: string[],
    ) {
        invalidTransactions.forEach(({ index, errors }) => {
            warnings.push(`Transaction at index ${index} has validation errors: ${errors.join(", ")}`);
        });
    }

    private normalizeFromExtracted(extractedTransactions: ExtractedTransaction[] | undefined) {
        const actualCurrency = this.actualTargetCurrency;

        extractedTransactions?.forEach((transaction) => {
            this.normalizateCurrencyForTransaction(transaction, actualCurrency);
            this.normalizateTextFieldsForTransaction(transaction);
            this.normalizateDateForTransaction(transaction);
            this.normalizateAmountForTransaction(transaction);

        });
    }

    private normalizateCurrencyForTransaction(transaction: ExtractedTransaction, targetCurrency: string) {
        if (transaction.currency !== targetCurrency) {
            const currentValue = this.currencyExchange(transaction.currency, transaction.amount);
            transaction.amount = currentValue;
            transaction.currency = targetCurrency;
        }
    }

    private normalizateTextFieldsForTransaction(transaction: ExtractedTransaction) {
        transaction.merchant = transaction.merchant?.trim() ?? "";
        transaction.category = transaction.category?.trim() || "Uncategorized";
    }
    
    private normalizateDateForTransaction(transaction: ExtractedTransaction) {
        if (!transaction.date) return;
        transaction.date = transaction.date.trim();
    }

    private normalizateAmountForTransaction(transaction: ExtractedTransaction) {
        if (transaction.amount <= 0) {
            transaction.amount = 0;
        }
    }

    private splitValidAndInvalidTransactions(extractedTransactions: ExtractedTransaction[] | undefined): {
        validTransactions: ExtractedTransaction[];
        invalidTransactions: { index: number; errors: string[] }[]} {
        const validTransactions: ExtractedTransaction[] = [];
        const invalidTransactions: { index: number; errors: string[] }[] = [];

        extractedTransactions?.forEach((transaction, index) => {
            const errors = this.validateRequiredFields(transaction);
            if (errors.length === 0) {
                validTransactions.push(transaction);
            } else {
                invalidTransactions.push({ index, errors });
            }
        });

        return { validTransactions, invalidTransactions };
    }

    private validateRequiredFields(transaction: ExtractedTransaction): string[] {
        const errors: string[] = [];
        if (transaction.date) {
            const dateErrors = this.validateDateFormat(transaction);
            errors.push(...dateErrors);
        } else {
            errors.push("Missing required field: date");
        }
        if (!transaction.merchant) {
            errors.push("Missing required field: merchant");
        }
        if (transaction.currency) {
            const currencyErrors = this.validateCurrencySupport(transaction);
            errors.push(...currencyErrors);
        } else {
            errors.push("Missing required field: currency");
        }
        if (transaction.amount === undefined || transaction.amount === null || transaction.amount <= 0) {
            errors.push("Missing required field: amount");
        }
        return errors;
    }

    private validateCurrencySupport(extractedTransactions: ExtractedTransaction): string[] {
        const errors: string[] = [];
        if (extractedTransactions.currency && !this.supportedCurrencies.includes(extractedTransactions.currency)) {
            errors.push(`Unsupported currency: ${extractedTransactions.currency}`);
        }
        return errors;
    }

    private validateDateFormat(extractedTransactions: ExtractedTransaction): string[] {
        const errors: string[] = [];
        if (extractedTransactions.date && !this.isValidDate(extractedTransactions.date)) {
            errors.push(`Invalid date format: ${extractedTransactions.date}`);
        }
        return errors;
    }

    private isValidDate(date: string): boolean {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

        const [year, month, day] = date.split("-").map(Number);
        const parsed = new Date(Date.UTC(year, month - 1, day));

        return (
            parsed.getUTCFullYear() === year &&
            parsed.getUTCMonth() === month - 1 &&
            parsed.getUTCDate() === day
        );
    }

    private currencyExchange(sourceCurrency: string, amount: number): number {
        const exchangeRates: Record<string, number> = {
            //TODO: These rates should be fetched from an api or a library, not hardcoded
            "USD": 40.38,
            "EUR": 46.07,
        };

        if (sourceCurrency !== this.actualTargetCurrency) {
            const rate = exchangeRates[sourceCurrency];
            if (!rate) {
                throw new Error(`Unsupported source currency: ${sourceCurrency}`);
            }

            return amount * rate;
        }

        return amount;

    }
}
