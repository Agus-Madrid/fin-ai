import { Injectable } from '@angular/core';
import { BudgetVm, IncomeSource } from '../../shared/models/budget.model';
import { Income } from '../../shared/models/income.model';
import { FixedCommitment } from '../../shared/models/fixed-commitment.model';

const DEFAULT_INCOME_SOURCE = 'Ingreso manual';
const DEFAULT_FIXED_CATEGORY = 'Compromiso fijo';

@Injectable({ providedIn: 'root' })
export class BudgetDataService {
  buildBudgetVm(incomes: Income[], fixedCommitments: FixedCommitment[]): BudgetVm {
    const incomeSources = incomes.map((income, index) =>
      this.toIncomeSource(income, index)
    );
    const fixedExpenses = fixedCommitments.map((commitment) =>
      this.toFixedExpense(commitment)
    );
    const totalIncome = incomeSources.reduce((sum, income) => sum + income.amount, 0);
    const totalFixed = fixedExpenses.reduce((sum, fixed) => sum + fixed.amount, 0);
    const discretionary = Math.max(totalIncome - totalFixed, 0);
    const remainderPercent = totalIncome > 0
      ? Math.round((discretionary / totalIncome) * 100)
      : 0;

    return {
      currency: 'UYU',
      incomeSources,
      fixedExpenses,
      savings: {
        monthlyGoal: 1500,
        progress: 70,
        projectedMessage:
          'Tu fondo de emergencia estara completo en 3,4 meses. Un extra de $200 reduce 2 semanas.'
      },
      commitments: {
        preCommitted: totalFixed,
        discretionary,
        remainderPercent
      },
      totalIncome,
      totalFixed
    };
  }

  private toIncomeSource(income: Income, index: number): IncomeSource {
    const parsedAmount = Number(income.amount);

    return {
      id: income.id,
      label: income.name,
      source: income.description ?? DEFAULT_INCOME_SOURCE,
      amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
      status: 'Confirmado',
      timing: `Actualizado · #${index + 1}`,
      progress: 100
    };
  }

  private toFixedExpense(commitment: FixedCommitment) {
    const parsedAmount = Number(commitment.amount);
    const amount = Number.isFinite(parsedAmount) ? parsedAmount : 0;

    return {
      id: commitment.id,
      name: commitment.name,
      category: commitment.description ?? DEFAULT_FIXED_CATEGORY,
      amount,
      progress: 100,
      icon: 'bi-receipt'
    };
  }
}
