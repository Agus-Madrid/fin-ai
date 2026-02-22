import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TransactionService } from '../../dashboard/services/transaction.service';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { TransactionFormModalContainerComponent } from '../modals/containers/transaction-form-modal.container.component';
import { TransactionsViewComponent } from '../presentational/transactions.view.component';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [NgIf, TransactionsViewComponent],
  template: `
    <ng-container *ngIf="transactionResource">
      <app-transactions-view
        [transactions]="transactionResource"
        (edit)="editTransaction($event)"
        (delete)="deleteTransaction($event)" />
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsPageComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly modalService = inject(NgbModal);

  readonly transactionResource = this.transactionService.getTransactionsByStatus(TransactionStatus.CONFIRMED);

  editTransaction(tx: Transaction) {
    const modalRef = this.modalService.open(TransactionFormModalContainerComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.transaction = tx;
  }

  deleteTransaction(_tx: Transaction) {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.title = 'Eliminar gasto';
    modalRef.componentInstance.message = 'Estas seguro de que deseas eliminar este gasto? Esta accion no se puede deshacer.';
    modalRef.componentInstance.confirmText = 'Confirmar';
    modalRef.componentInstance.cancelText = 'Cancelar';
    modalRef.componentInstance.tone = 'danger';

    modalRef.componentInstance.confirm.subscribe(() => modalRef.close(true));
    modalRef.componentInstance.cancel.subscribe(() => modalRef.dismiss('cancel'));
  }
}
