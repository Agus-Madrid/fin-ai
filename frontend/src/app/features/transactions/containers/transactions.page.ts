import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TransactionService } from '../../dashboard/services/transaction.service';
import { CategoryService } from '../../dashboard/services/category.service';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { TransactionFormModalContainerComponent } from '../modals/containers/transaction-form-modal.container.component';
import { TransactionsViewComponent } from '../presentational/transactions.view.component';
import { Category } from '../../../shared/models/category.model';
import { CreateTransactionRequest } from '../../../shared/models/transaction-create.model';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, TransactionsViewComponent],
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
  private readonly categoryService = inject(CategoryService);
  private readonly modalService = inject(NgbModal);
  private readonly formBuilder = inject(FormBuilder);

  readonly transactionFormControlNames = {
    description: 'description',
    categoryId: 'categoryId',
    date: 'date',
    amount: 'amount'
  } as const;

  readonly transactionResource = this.transactionService.getTransactionsByStatus(TransactionStatus.CONFIRMED);
  readonly categoriesResource = this.categoryService.getCategories();

  editTransaction(tx: Transaction) {
    const modalRef = this.modalService.open(TransactionFormModalContainerComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.form = this.buildTransactionForm(tx);
    modalRef.componentInstance.formControlNames = this.transactionFormControlNames;
    modalRef.componentInstance.transaction = tx;
    modalRef.componentInstance.categories = this.categoriesResource.value() ?? this.buildTransactionCategories(tx);

    modalRef.componentInstance.save.subscribe((editedTransaction: Transaction) => {
      this.handleEditTransaction(editedTransaction, modalRef);
    });
    modalRef.componentInstance.cancel.subscribe(() => modalRef.dismiss('cancel'));
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

    modalRef.componentInstance.confirm.subscribe(() => this.handleDeleteConfirmation(true, modalRef, _tx));
    modalRef.componentInstance.cancel.subscribe(() => this.handleDeleteConfirmation(false, modalRef));
  }

  private buildTransactionForm(tx: Transaction): FormGroup {
    return this.formBuilder.group({
      [this.transactionFormControlNames.description]: [tx.description ?? '', Validators.required],
      [this.transactionFormControlNames.categoryId]: [tx.category?.id ?? '', Validators.required],
      [this.transactionFormControlNames.date]: [this.toDateInputValue(tx.date), Validators.required],
      [this.transactionFormControlNames.amount]: [tx.amount ?? 0, Validators.required]
    });
  }

  private buildTransactionCategories(tx: Transaction): Category[] {
    if (!tx.category) {
      return [];
    }
    return [tx.category];
  }

  private toDateInputValue(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  }

  handleDeleteConfirmation(result: boolean, modalRef: NgbModalRef, tx?: Transaction) {
    if (result && tx) {
      this.transactionService.delete(tx.id).subscribe({
        next: () => {
          modalRef.close(result);
          this.transactionResource.reload();
        },
        error: () => modalRef.dismiss('delete_error')
      });
      return;
    }
    modalRef.dismiss('cancel');
  }

  handleEditTransaction(editedTransaction: Transaction, modalRef: NgbModalRef) {
    const editedTransactionData: CreateTransactionRequest = {
      description: editedTransaction.description,
      amount: editedTransaction.amount,
      date: this.toDateInputValue(editedTransaction.date),
      categoryId: editedTransaction.category.id
    };

    this.transactionService.update(editedTransaction.id, editedTransactionData).subscribe({
      next: () => {
        modalRef.close(editedTransaction);
        this.transactionResource.reload();
      },
      error: () => {
        modalRef.dismiss('update_error');
      }
    });
  }
}
