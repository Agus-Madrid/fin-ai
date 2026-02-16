import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { BudgetVm } from '../../shared/models/budget.model';

@Injectable({ providedIn: 'root' })
export class BudgetDataService {
  getBudgetVm() {
    const vm: BudgetVm = {
      currency: 'USD',
      incomeSources: [
        {
          id: 'inc-1',
          label: 'Salario Principal',
          source: 'Enterprise Tech Corp.',
          amount: 6000,
          status: 'Confirmado',
          timing: 'Depósito directo · 1°',
          progress: 100
        },
        {
          id: 'inc-2',
          label: 'Freelance',
          source: 'Consulting Hours',
          amount: 1200,
          status: 'Pendiente',
          timing: 'Facturado · Net 30',
          progress: 60
        }
      ],
      fixedExpenses: [
        {
          id: 'fix-1',
          name: 'Alquiler & Seguro',
          category: 'Vivienda',
          amount: 1950,
          progress: 90,
          icon: 'bi-house'
        },
        {
          id: 'fix-2',
          name: 'Servicios',
          category: 'Variable',
          amount: 200,
          progress: 45,
          icon: 'bi-lightning-charge'
        },
        {
          id: 'fix-3',
          name: 'SaaS Suite',
          category: 'Tecnología',
          amount: 150,
          progress: 20,
          icon: 'bi-diagram-3'
        },
        {
          id: 'fix-4',
          name: 'Transporte',
          category: 'Estimado',
          amount: 1150,
          progress: 70,
          icon: 'bi-car-front'
        }
      ],
      savings: {
        monthlyGoal: 1500,
        progress: 70,
        projectedMessage:
          'Tu fondo de emergencia estará completo en 3.4 meses. Un extra de $200 reduce 2 semanas.'
      },
      commitments: {
        preCommitted: 4950,
        discretionary: 2250,
        remainderPercent: 31
      },
      totalIncome: 7200,
      totalFixed: 3450
    };

    return of(vm);
  }
}
