import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DashboardDataService } from '../../../core/data/dashboard-data.service';
import { DashboardViewComponent } from '../presentational/dashboard.view.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../services/category.service';
import { TransactionService } from '../services/transaction.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, DashboardViewComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <app-dashboard-view
        [vm]="vm"
        [manualTransactionFormGroup]="manualTransactionFormGroup"
        [categories]="categories()"
        (submitTransaction)="createTransaction()"
      ></app-dashboard-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageComponent {
  private readonly data = inject(DashboardDataService);
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoryService);
  private readonly transactionsService = inject(TransactionService);

  readonly manualTransactionFormGroup: FormGroup = this.fb.group({
    amount: [0, Validators.required],
    date: ['', Validators.required],
    description: ['', Validators.required],
    categoryId: ['', Validators.required]
  });

  readonly categoriesResource = this.categoriesService.getCategories();
  readonly categories = this.categoriesResource.value;

  readonly vm$ = this.data.getDashboardVm();

  async createTransaction() {
    if (this.manualTransactionFormGroup.invalid) {
      this.manualTransactionFormGroup.markAllAsTouched();
      return;
    }

    const formValue = this.manualTransactionFormGroup.getRawValue();
    await firstValueFrom(
      this.transactionsService.create({
        amount: formValue.amount,
        date: formValue.date,
        description: formValue.description,
        categoryId: formValue.categoryId
      })
    );

    this.manualTransactionFormGroup.reset({
      amount: 0,
      date: '',
      description: '',
      categoryId: ''
    });
  }
}
