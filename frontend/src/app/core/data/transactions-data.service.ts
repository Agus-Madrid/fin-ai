import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { TransactionsVm } from '../../shared/models/transactions-page.model';

@Injectable({ providedIn: 'root' })
export class TransactionsDataService {
  getTransactionsVm() {
    const vm: TransactionsVm = {
      currency: 'USD',
      periodLabel: 'Últimos 30 días',
      filters: {
        dateRange: '01 Feb - 28 Feb',
        account: 'Chase Sapphire',
        search: ''
      },
      totalCount: 243,
      rangeLabel: '1-8',
      highlightedId: 'tx-edit',
      transactions: [
        {
          id: 'tx-100',
          dateLabel: '24 Feb 2026',
          merchant: 'Whole Foods Market',
          category: 'Comida',
          method: 'Chase ·• 4291',
          amount: 142.8,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-bag'
        },
        {
          id: 'tx-101',
          dateLabel: '23 Feb 2026',
          merchant: 'Netflix Subscription',
          category: 'Entretenimiento',
          method: 'Cuenta corriente',
          amount: 15.99,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-film'
        },
        {
          id: 'tx-102',
          dateLabel: '22 Feb 2026',
          merchant: 'Client Payment #1024',
          category: 'Ingreso',
          method: 'Business Chk',
          amount: 2450,
          currency: 'USD',
          type: 'income',
          icon: 'bi-cash-coin'
        },
        {
          id: 'tx-103',
          dateLabel: '21 Feb 2026',
          merchant: 'Shell Station',
          category: 'Transporte',
          method: 'Chase ·• 4291',
          amount: 45.2,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-fuel-pump'
        },
        {
          id: 'tx-edit',
          dateLabel: '20 Feb 2026',
          merchant: 'Unknown Merchant 1002',
          category: 'Sin categoría',
          method: 'Visa ·• 8822',
          amount: 210,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-pencil-square'
        },
        {
          id: 'tx-104',
          dateLabel: '19 Feb 2026',
          merchant: 'Sushi Bar Downtown',
          category: 'Comida',
          method: 'Chase ·• 4291',
          amount: 82.5,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-egg-fried'
        },
        {
          id: 'tx-105',
          dateLabel: '19 Feb 2026',
          merchant: 'City Power & Light',
          category: 'Servicios',
          method: 'Checking',
          amount: 120,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-lightning-charge'
        },
        {
          id: 'tx-106',
          dateLabel: '18 Feb 2026',
          merchant: 'Apple Store',
          category: 'Tecnología',
          method: 'Chase ·• 4291',
          amount: 2199,
          currency: 'USD',
          type: 'expense',
          icon: 'bi-laptop'
        }
      ]
    };

    return of(vm);
  }
}
