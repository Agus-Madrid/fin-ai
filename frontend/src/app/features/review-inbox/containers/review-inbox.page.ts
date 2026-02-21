import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TransactionService } from '../../dashboard/services/transaction.service';
import { ReviewInboxViewComponent } from '../presentational/review-inbox.view.component';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { InboxItem, InboxState } from '../../../shared/models/inbox.model';
import { Transaction } from '../../../shared/models/transaction.model';

@Component({
  selector: 'app-review-inbox-page',
  standalone: true,
  imports: [ReviewInboxViewComponent],
  template: `
    <app-review-inbox-view [inbox]="inbox()" (selectItem)="onSelectItem($event)"></app-review-inbox-view>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewInboxPageComponent {
  private readonly transactions = inject(TransactionService);
  private readonly pendingResource = this.transactions.getTransactionsByStatus(TransactionStatus.PENDING);
  private readonly selectedItemId = signal<string | null>(null);

  //Computed for mapping transactions to inbox state and have the reactivity to update the view
  readonly inbox = computed(() => {
    const items = (this.pendingResource.value() ?? []).map((tx) => this.toInboxItem(tx));
    const selectedItem = this.pickSelectedItem(items, this.selectedItemId());
    const categoryOptions = this.getCategoryOptions(items);
    return {
      pendingCount: items.length,
      items,
      selectedItem,
      categoryOptions
    } satisfies InboxState;
  });

  onSelectItem(item: InboxItem) {
    this.selectedItemId.set(item.id);
  }

  private pickSelectedItem(items: InboxItem[], selectedId: string | null): InboxItem {
    if (items.length === 0) {
      return this.emptyItem();
    }
    if (!selectedId) {
      return items[0];
    }
    return items.find((item) => item.id === selectedId) ?? items[0];
  }

  private toInboxItem(transaction: Transaction): InboxItem {
    const categoryName = transaction.category?.name ?? 'Sin categoria';
    const categoryIcon = transaction.category?.icon ?? '';
    const dateValue = this.formatDateValue(transaction.date);
    const amount = this.parseAmount(transaction.amount);
    return {
      id: String(transaction.id),
      merchant: transaction.description,
      category: categoryName,
      categoryIcon,
      dateLabel: this.formatDateLabel(transaction.date),
      dateValue,
      amount,
      amountValue: this.formatAmountValue(amount),
      currency: 'USD',
      status: 'Pendiente',
      confidence: 'medium',
      tag: transaction.category ? undefined : 'Sin categoria'
    };
  }

  private emptyItem(): InboxItem {
    return {
      id: 'empty',
      merchant: 'Sin transacciones pendientes',
      category: '',
      categoryIcon: '',
      dateLabel: '',
      dateValue: '',
      amount: 0,
      amountValue: '',
      currency: 'USD',
      status: '',
      confidence: 'low'
    };
  }

  private getCategoryOptions(items: InboxItem[]): string[] {
    const options = Array.from(
      new Set(items.map((item) => item.category).filter((category) => category))
    );
    if (options.length === 0) {
      return ['Sin categoria'];
    }
    return options;
  }

  private formatDateLabel(value: Date | string): string {
    const date = this.parseDate(value);
    if (!date) {
      return '';
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private formatDateValue(value: Date | string): string {
    const date = this.parseDate(value);
    if (!date) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  }

  private parseDate(value: Date | string): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    if (!value) {
      return null;
    }
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    const parsedUtc = new Date(`${normalized}Z`);
    if (!Number.isNaN(parsedUtc.getTime())) {
      return parsedUtc;
    }
    return null;
  }

  private parseAmount(amount: number | string): number {
    if (typeof amount === 'number') {
      return amount;
    }
    const parsed = Number(amount);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private formatAmountValue(amount: number): string {
    if (!Number.isFinite(amount)) {
      return '';
    }
    return amount.toString();
  }
}
