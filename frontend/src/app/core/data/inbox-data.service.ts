import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { InboxVm } from '../../shared/models/inbox.model';

@Injectable({ providedIn: 'root' })
export class InboxDataService {
  getInboxVm() {
    const vm: InboxVm = {
      pendingCount: 4,
      items: [
        {
          id: 'inbox-1',
          merchant: 'Uber Technologies',
          category: 'Transporte',
          dateLabel: '24 Feb 2026',
          amount: 24.5,
          currency: 'USD',
          status: 'Pendiente',
          confidence: 'low',
          tag: 'Sin categoría'
        },
        {
          id: 'inbox-2',
          merchant: 'Starbucks Coffee',
          category: 'Comida',
          dateLabel: '23 Feb 2026',
          amount: 5.75,
          currency: 'USD',
          status: 'Sugerido',
          confidence: 'medium',
          suggested: true
        },
        {
          id: 'inbox-3',
          merchant: 'Netflix',
          category: 'Entretenimiento',
          dateLabel: '21 Feb 2026',
          amount: 15.99,
          currency: 'USD',
          status: 'Sugerido',
          confidence: 'high',
          suggested: true
        },
        {
          id: 'inbox-4',
          merchant: 'Amazon Marketplace',
          category: 'Compras',
          dateLabel: '20 Feb 2026',
          amount: 89.2,
          currency: 'USD',
          status: 'Normal',
          confidence: 'medium'
        }
      ],
      selectedItem: {
        id: 'inbox-1',
        merchant: 'Uber Technologies',
        category: 'Transporte',
        dateLabel: '24 Feb 2026 · 20:42',
        amount: 24.5,
        currency: 'USD',
        status: 'Pendiente',
        confidence: 'low',
        tag: 'Sin categoría'
      }
    };

    return of(vm);
  }
}
