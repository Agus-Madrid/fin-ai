import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import {
  TRANSACTION_FORM_CONTROL_NAMES,
  TransactionFormSavePayload,
  TransactionFormGroup
} from '../modals/transaction-form.types';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [NgIf, ReactiveFormsModule, TransactionsViewComponent],
  template: `
    <ng-container *ngIf="transactionResource">
      <app-transactions-view
        [transactions]="transactionResource"
        (createRequested)="createTransaction()"
        (editRequested)="editTransaction($event)"
        (deleteRequested)="deleteTransaction($event)" />
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsPageComponent {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly modalService = inject(NgbModal);
  private readonly formBuilder = inject(FormBuilder);

  readonly transactionResource = this.transactionService.getTransactionsByStatus(TransactionStatus.CONFIRMED);
  readonly categoriesResource = this.categoryService.getCategories();

  createTransaction(): void {
    this.openTransactionFormModal();
  }

  editTransaction(tx: Transaction) {
    this.openTransactionFormModal(tx);
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

    modalRef.componentInstance.confirmRequested.subscribe(() => this.handleDeleteConfirmation(true, modalRef, _tx));
    modalRef.componentInstance.dismissRequested.subscribe(() => this.handleDeleteConfirmation(false, modalRef));
  }

  private openTransactionFormModal(transaction?: Transaction): void {
    const modalRef = this.modalService.open(TransactionFormModalContainerComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    const selectedTransaction = transaction ?? null;
    modalRef.componentInstance.form = this.buildTransactionForm(selectedTransaction);
    modalRef.componentInstance.formControlNames = TRANSACTION_FORM_CONTROL_NAMES;
    modalRef.componentInstance.transaction = selectedTransaction;
    modalRef.componentInstance.categories = this.categoriesResource.value() ?? this.buildTransactionCategories(selectedTransaction);

    modalRef.componentInstance.saveRequested.subscribe((payload: TransactionFormSavePayload) => {
      this.handleSaveTransaction(payload, modalRef);
    });
    modalRef.componentInstance.dismissRequested.subscribe(() => modalRef.dismiss('cancel'));
  }

  private buildTransactionForm(transaction: Transaction | null): TransactionFormGroup {
    const categoryId = transaction?.category?.id ?? '';
    const amount = transaction?.amount ?? null;
    const date = transaction ? this.toDateInputValue(transaction.date) : this.toDateInputValue(new Date());
    const description = transaction?.description ?? '';

    return this.formBuilder.group({
      [TRANSACTION_FORM_CONTROL_NAMES.description]: this.formBuilder.nonNullable.control(
        description,
        Validators.required
      ),
      [TRANSACTION_FORM_CONTROL_NAMES.categoryId]: this.formBuilder.nonNullable.control(
        categoryId,
        Validators.required
      ),
      [TRANSACTION_FORM_CONTROL_NAMES.date]: this.formBuilder.nonNullable.control(
        date,
        Validators.required
      ),
      [TRANSACTION_FORM_CONTROL_NAMES.amount]: this.formBuilder.control(
        amount,
        Validators.required
      )
    }) as TransactionFormGroup;
  }

  private buildTransactionCategories(transaction: Transaction | null): Category[] {
    if (!transaction?.category) {
      return [];
    }
    return [transaction.category];
  }

  private toDateInputValue(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  }

  private handleDeleteConfirmation(result: boolean, modalRef: NgbModalRef, tx?: Transaction) {
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

  private handleSaveTransaction(payload: TransactionFormSavePayload, modalRef: NgbModalRef): void {
    const request: CreateTransactionRequest = {
      ...payload.request,
      date: this.toDateInputValue(payload.request.date)
    };

    if (!payload.transactionId) {
      this.transactionService.create(request).subscribe({
        next: () => {
          modalRef.close(payload);
          this.transactionResource.reload();
        },
        error: () => {
          modalRef.dismiss('create_error');
        }
      });
      return;
    }

    this.transactionService.update(String(payload.transactionId), request).subscribe({
      next: () => {
        modalRef.close(payload);
        this.transactionResource.reload();
      },
      error: () => {
        modalRef.dismiss('update_error');
      }
    });
  }
}
