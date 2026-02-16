import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { DashboardVm } from '../../shared/models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  getDashboardVm() {
    const vm: DashboardVm = {
      currency: 'USD',
      monthLabel: 'February 2026',
      spendableBalance: 4750,
      spendableDeltaPercent: 12,
      incomeTotal: 8400,
      fixedExpenses: 2150,
      savingsTarget: 1500,
      savingsCurrent: 12450,
      savingsGoalLabel: 'Fondo de Emergencia',
      savingsGoalTarget: 25000,
      weeklyBudgetUsed: 320,
      weeklyBudgetTotal: 500,
      trend: [
        { label: 'Sep', value: 5200 },
        { label: 'Oct', value: 4800 },
        { label: 'Nov', value: 5100 },
        { label: 'Dec', value: 5600 },
        { label: 'Jan', value: 4950 },
        { label: 'Feb', value: 4700 }
      ],
      categories: [
        { name: 'Vivienda', amount: 883, color: '#2b6cee' },
        { name: 'Comida', amount: 491, color: '#10b981' },
        { name: 'Ocio', amount: 392, color: '#f59e0b' },
        { name: 'Transporte', amount: 210, color: '#a855f7' }
      ],
      recentTransactions: [
        {
          id: 'tx-1',
          dateLabel: 'Hoy · 12:45',
          merchant: 'Whole Foods Market',
          category: 'Comida',
          method: 'Tarjeta ·• 4291',
          amount: 64.2,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-basket'
        },
        {
          id: 'tx-2',
          dateLabel: 'Ayer · 21:10',
          merchant: 'Uber Technologies',
          category: 'Transporte',
          method: 'Tarjeta ·• 8822',
          amount: 12.5,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-car-front'
        },
        {
          id: 'tx-3',
          dateLabel: '10 Feb',
          merchant: 'Netflix',
          category: 'Suscripciones',
          method: 'Cuenta corriente',
          amount: 15.99,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-film'
        },
        {
          id: 'tx-4',
          dateLabel: '09 Feb',
          merchant: 'Cliente ACME',
          category: 'Ingreso',
          method: 'Transferencia',
          amount: 2450,
          currency: 'USD',
          type: 'income',
          icon: 'bi-cash-coin'
        }
      ]
    };

    return of(vm);
  }
}
