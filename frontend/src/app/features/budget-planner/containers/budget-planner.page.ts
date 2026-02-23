import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BudgetDataService } from '../../../core/data/budget-data.service';
import { BudgetPlannerViewComponent } from '../presentational/budget-planner.view.component';
import { BudgetPlannerService } from '../services/budget-planner.service';
import { IncomeFormModalContainerComponent } from '../modals/containers/income-form-modal.container.component';
import { INCOME_FORM_CONTROL_NAMES, IncomeFormGroup, IncomeFormSavePayload } from '../modals/income-form.types';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Income } from '../../../shared/models/income.model';
import { FixedCommitment } from '../../../shared/models/fixed-commitment.model';
import { FixedExpense, IncomeSource } from '../../../shared/models/budget.model';
import { CreateSavingGoalRequest } from '../../../shared/models/saving-goal-create.model';
import { FixedCommitmentFormModalContainerComponent } from '../modals/containers/fixed-commitment-form-modal.container.component';
import {
  FIXED_COMMITMENT_FORM_CONTROL_NAMES,
  FixedCommitmentFormGroup,
  FixedCommitmentFormSavePayload
} from '../modals/fixed-commitment-form.types';

@Component({
  selector: 'app-budget-planner-page',
  standalone: true,
  imports: [BudgetPlannerViewComponent],
  template: `
    <app-budget-planner-view
      [budgetViewModel]="budgetViewModel()"
      (addIncomeRequested)="openIncomeFormModal()"
      (editIncomeRequested)="editIncome($event)"
      (deleteIncomeRequested)="deleteIncome($event)"
      (addFixedCommitmentRequested)="openFixedCommitmentFormModal()"
      (editFixedCommitmentRequested)="editFixedCommitment($event)"
      (deleteFixedCommitmentRequested)="deleteFixedCommitment($event)"
      (createSavingGoalRequested)="createSavingGoal($event)"
      (deleteSavingGoalRequested)="deleteSavingGoal($event)"
      (updateMonthlyGoalRequested)="updateMonthlyGoalSavings($event)"
      (confirmMonthlySavingsRequested)="confirmMonthlySavings($event)"
      (skipMonthlySavingsRequested)="skipMonthlySavings()">
    </app-budget-planner-view>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetPlannerPageComponent {
  private readonly data = inject(BudgetDataService);
  private readonly budgetPlannerService = inject(BudgetPlannerService);
  private readonly modalService = inject(NgbModal);
  private readonly formBuilder = inject(FormBuilder);

  readonly incomesResource = this.budgetPlannerService.getIncomes();
  readonly fixedCommitmentsResource = this.budgetPlannerService.getFixedCommitments();
  readonly savingGoalsResource = this.budgetPlannerService.getSavingGoals();
  readonly currentPeriodSavingGoalsResource = this.budgetPlannerService.getActiveSavingGoals();
  readonly userResource = this.budgetPlannerService.getUser();
  readonly savingsLogsResource = this.budgetPlannerService.getSavingsLogs();
  readonly budgetViewModel = computed(() => this.buildBudgetViewModel());

  openIncomeFormModal(income?: Income): void {
    const modalRef = this.modalService.open(IncomeFormModalContainerComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.income = income ?? null;
    modalRef.componentInstance.form = this.buildIncomeForm(income ?? null);

    modalRef.componentInstance.saveRequested.subscribe((payload: IncomeFormSavePayload) => {
      this.handleSaveIncome(payload, modalRef);
    });

    modalRef.componentInstance.dismissRequested.subscribe(() => modalRef.dismiss('cancel'));
  }

  editIncome(income: IncomeSource) {
    const incomeEntity = this.findIncomeById(income.id);
    if (!incomeEntity) {
      return;
    }
    this.openIncomeFormModal(incomeEntity);
  }

  deleteIncome(income: IncomeSource) {
    const incomeEntity = this.findIncomeById(income.id);
    if (!incomeEntity) {
      return;
    }

    this.openDeleteModal({
      title: 'Eliminar ingreso',
      message: `Estas seguro de que deseas eliminar "${incomeEntity.name}"? Esta accion no se puede deshacer.`,
      onConfirm: () => this.budgetPlannerService.deleteIncome(incomeEntity.id),
      onCompleted: () => this.incomesResource.reload()
    });
  }

  openFixedCommitmentFormModal(commitment?: FixedCommitment): void {
    const modalRef = this.modalService.open(FixedCommitmentFormModalContainerComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.commitment = commitment ?? null;
    modalRef.componentInstance.form = this.buildFixedCommitmentForm(commitment ?? null);

    modalRef.componentInstance.saveRequested.subscribe((payload: FixedCommitmentFormSavePayload) => {
      this.handleSaveFixedCommitment(payload, modalRef);
    });

    modalRef.componentInstance.dismissRequested.subscribe(() => modalRef.dismiss('cancel'));
  }

  editFixedCommitment(expense: FixedExpense) {
    const commitment = this.findCommitmentById(expense.id);
    if (!commitment) {
      return;
    }
    this.openFixedCommitmentFormModal(commitment);
  }

  deleteFixedCommitment(expense: FixedExpense) {
    const commitment = this.findCommitmentById(expense.id);
    if (!commitment) {
      return;
    }

    this.openDeleteModal({
      title: 'Eliminar gasto fijo',
      message: `Estas seguro de que deseas eliminar "${commitment.name}"? Esta accion no se puede deshacer.`,
      onConfirm: () => this.budgetPlannerService.deleteFixedCommitment(commitment.id),
      onCompleted: () => this.fixedCommitmentsResource.reload()
    });
  }

  updateMonthlyGoalSavings(goalMonthlySavings: number) {
    this.budgetPlannerService.updateMonthlyGoalSavings(goalMonthlySavings).subscribe({
      next: () => this.userResource.reload()
    });
  }

  confirmMonthlySavings(confirmedAmount: number) {
    this.budgetPlannerService.confirmSavingsLog(
      this.getCurrentPeriod(),
      confirmedAmount,
      'CONFIRMED'
    ).subscribe({
      next: () => this.reloadSavingsState()
    });
  }

  skipMonthlySavings() {
    this.budgetPlannerService.confirmSavingsLog(
      this.getCurrentPeriod(),
      undefined,
      'SKIPPED'
    ).subscribe({
      next: () => this.reloadSavingsState()
    });
  }

  createSavingGoal(request: CreateSavingGoalRequest) {
    this.budgetPlannerService.createSavingGoal(request).subscribe({
      next: () => this.reloadGoalsState()
    });
  }

  deleteSavingGoal(goalId: string) {
    const goal = (this.savingGoalsResource.value() ?? []).find((item) => item.id === goalId);
    if (!goal) {
      return;
    }

    this.openDeleteModal({
      title: 'Eliminar meta de ahorro',
      message: `Estas seguro de que deseas eliminar "${goal.name}"? Esta accion no se puede deshacer.`,
      onConfirm: () => this.budgetPlannerService.deleteSavingGoal(goal.id),
      onCompleted: () => this.reloadGoalsState()
    });
  }

  private buildIncomeForm(income: Income | null): IncomeFormGroup {
    return this.formBuilder.group({
      [INCOME_FORM_CONTROL_NAMES.name]: this.formBuilder.nonNullable.control(
        income?.name ?? '',
        Validators.required
      ),
      [INCOME_FORM_CONTROL_NAMES.description]: this.formBuilder.nonNullable.control(
        income?.description ?? ''
      ),
      [INCOME_FORM_CONTROL_NAMES.amount]: this.formBuilder.control(
        income?.amount ?? null,
        Validators.required
      )
    }) as IncomeFormGroup;
  }

  private buildFixedCommitmentForm(commitment: FixedCommitment | null): FixedCommitmentFormGroup {
    return this.formBuilder.group({
      [FIXED_COMMITMENT_FORM_CONTROL_NAMES.name]: this.formBuilder.nonNullable.control(
        commitment?.name ?? '',
        Validators.required
      ),
      [FIXED_COMMITMENT_FORM_CONTROL_NAMES.description]: this.formBuilder.nonNullable.control(
        commitment?.description ?? ''
      ),
      [FIXED_COMMITMENT_FORM_CONTROL_NAMES.amount]: this.formBuilder.control(
        commitment?.amount ?? null,
        Validators.required
      )
    }) as FixedCommitmentFormGroup;
  }

  private handleSaveIncome(payload: IncomeFormSavePayload, modalRef: NgbModalRef) {
    if (!payload.incomeId) {
      this.budgetPlannerService.createIncome(payload.request).subscribe({
        next: () => {
          modalRef.close(payload);
          this.incomesResource.reload();
        },
        error: () => modalRef.dismiss('create_error')
      });
      return;
    }

    this.budgetPlannerService.updateIncome(payload.incomeId, payload.request).subscribe({
      next: () => {
        modalRef.close(payload);
        this.incomesResource.reload();
      },
      error: () => modalRef.dismiss('update_error')
    });
  }

  private handleSaveFixedCommitment(
    payload: FixedCommitmentFormSavePayload,
    modalRef: NgbModalRef
  ) {
    if (!payload.commitmentId) {
      this.budgetPlannerService.createFixedCommitment(payload.request).subscribe({
        next: () => {
          modalRef.close(payload);
          this.fixedCommitmentsResource.reload();
        },
        error: () => modalRef.dismiss('create_error')
      });
      return;
    }

    this.budgetPlannerService.updateFixedCommitment(payload.commitmentId, payload.request).subscribe({
      next: () => {
        modalRef.close(payload);
        this.fixedCommitmentsResource.reload();
      },
      error: () => modalRef.dismiss('update_error')
    });
  }

  private openDeleteModal(config: {
    title: string;
    message: string;
    onConfirm: () => ReturnType<BudgetPlannerService['deleteIncome']>;
    onCompleted: () => void;
  }) {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.title = config.title;
    modalRef.componentInstance.message = config.message;
    modalRef.componentInstance.confirmText = 'Eliminar';
    modalRef.componentInstance.cancelText = 'Cancelar';
    modalRef.componentInstance.tone = 'danger';

    modalRef.componentInstance.confirmRequested.subscribe(() => {
      config.onConfirm().subscribe({
        next: () => {
          modalRef.close(true);
          config.onCompleted();
        },
        error: () => modalRef.dismiss('delete_error')
      });
    });

    modalRef.componentInstance.dismissRequested.subscribe(() => modalRef.dismiss('cancel'));
  }

  private findIncomeById(id: string): Income | null {
    const incomes = this.incomesResource.value() ?? [];
    return incomes.find((income) => income.id === id) ?? null;
  }

  private findCommitmentById(id: string): FixedCommitment | null {
    const commitments = this.fixedCommitmentsResource.value() ?? [];
    return commitments.find((commitment) => commitment.id === id) ?? null;
  }

  private reloadSavingsState() {
    this.savingsLogsResource.reload();
    this.userResource.reload();
  }

  private reloadGoalsState() {
    this.savingGoalsResource.reload();
    this.currentPeriodSavingGoalsResource.reload();
    this.userResource.reload();
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  private buildBudgetViewModel() {
    return this.data.buildBudgetViewModel(
      this.incomesResource.value() ?? [],
      this.fixedCommitmentsResource.value() ?? [],
      this.userResource.value(),
      this.savingsLogsResource.value() ?? [],
      this.savingGoalsResource.value() ?? [],
      this.currentPeriodSavingGoalsResource.value() ?? []
    );
  }
}
