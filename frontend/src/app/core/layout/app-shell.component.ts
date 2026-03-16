import { Component, DestroyRef, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavComponent } from './top-nav.component';
import { BudgetPlannerService } from '../../features/budget-planner/services/budget-planner.service';
import { TransactionService } from '../../features/dashboard/services/transaction.service';
import { NotificationCenterService } from '../notifications/notification-center.service';
import { TransactionStatus } from '../../shared/enum/transaction-status.enum';

const SAVINGS_ALERTS_SOURCE = 'budget-savings';
const REVIEW_INBOX_ALERTS_SOURCE = 'review-inbox-pending';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, TopNavComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly budgetPlannerService = inject(BudgetPlannerService);
  private readonly transactionService = inject(TransactionService);
  private readonly notificationCenter = inject(NotificationCenterService);
  private readonly budgetViewModelResource = this.budgetPlannerService.getBudgetViewModel();
  private readonly pendingTransactionsResource = this.transactionService.getTransactionsByStatus(
    TransactionStatus.PENDING
  );

  constructor() {
    effect(() => {
      const alerts = this.budgetViewModelResource.value()?.savings.alerts ?? [];
      this.notificationCenter.setSourceNotifications(
        SAVINGS_ALERTS_SOURCE,
        alerts.map((alert) => ({
          id: alert.id,
          tone: alert.tone,
          title: 'Ahorro mensual',
          message: alert.message
        }))
      );
    });

    effect(() => {
      const pendingCount = (this.pendingTransactionsResource.value() ?? []).length;
      if (pendingCount <= 0) {
        this.notificationCenter.setSourceNotifications(REVIEW_INBOX_ALERTS_SOURCE, []);
        return;
      }

      const message = pendingCount === 1
        ? 'Tenes 1 transaccion pendiente por aprobar en Review Inbox.'
        : `Tenes ${pendingCount} transacciones pendientes por aprobar en Review Inbox.`;

      this.notificationCenter.setSourceNotifications(REVIEW_INBOX_ALERTS_SOURCE, [
        {
          id: 'pending-transactions',
          tone: 'WARNING',
          title: 'Review Inbox',
          message
        }
      ]);
    });

    this.destroyRef.onDestroy(() => {
      this.notificationCenter.clearSource(SAVINGS_ALERTS_SOURCE);
      this.notificationCenter.clearSource(REVIEW_INBOX_ALERTS_SOURCE);
    });
  }
}
