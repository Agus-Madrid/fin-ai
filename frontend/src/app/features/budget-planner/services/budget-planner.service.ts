import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import { BudgetViewModel } from '../../../shared/models/budget.model';
import {
  CreateIncomeRequest,
  UpdateIncomeRequest,
} from '../../../shared/models/income-create.model';
import { Income } from '../../../shared/models/income.model';
import { FixedCommitment } from '../../../shared/models/fixed-commitment.model';
import {
  CreateFixedCommitmentRequest,
  UpdateFixedCommitmentRequest,
} from '../../../shared/models/fixed-commitment-create.model';
import { User } from '../../../shared/models/user.model';
import { SavingsLog, SavingsLogStatus } from '../../../shared/models/savings-log.model';
import { SavingGoal } from '../../../shared/models/saving-goal.model';
import {
  CreateSavingGoalRequest,
  UpdateSavingGoalRequest,
} from '../../../shared/models/saving-goal-create.model';

interface UpdateMonthlyGoalSavingsRequest {
  goalMonthlySavings: number;
}

interface ConfirmSavingsLogDto {
  period: string;
  confirmedAmount?: number;
  status?: SavingsLogStatus;
}

@Injectable({
  providedIn: 'root',
})
export class BudgetPlannerService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly budgetViewModelReloadVersion = signal(0);

  getIncomes() {
    return rxResource<Income[], { apiBaseUrl: string }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
      }),
      loader: ({ request }) =>
        this.http.get<Income[]>(joinUrl(request.apiBaseUrl, '/incomes')),
      defaultValue: [],
    });
  }

  getBudgetViewModel() {
    return rxResource<BudgetViewModel | null, { apiBaseUrl: string; refreshVersion: number }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
        refreshVersion: this.budgetViewModelReloadVersion()
      }),
      loader: ({ request }) =>
        this.http.get<BudgetViewModel>(
          joinUrl(request.apiBaseUrl, '/budgets/planner'),
        ),
      defaultValue: null,
    });
  }

  reloadBudgetViewModel(): void {
    this.budgetViewModelReloadVersion.update((current) => current + 1);
  }

  createIncome(request: CreateIncomeRequest) {
    return this.http.post<Income>(joinUrl(this.config.apiBaseUrl(), '/incomes'), request);
  }

  updateIncome(incomeId: string, request: UpdateIncomeRequest) {
    return this.http.put<Income>(
      joinUrl(this.config.apiBaseUrl(), `/incomes/${incomeId}`),
      request,
    );
  }

  deleteIncome(incomeId: string) {
    return this.http.delete(joinUrl(this.config.apiBaseUrl(), `/incomes/${incomeId}`));
  }

  getFixedCommitments() {
    return rxResource<FixedCommitment[], { apiBaseUrl: string }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
      }),
      loader: ({ request }) =>
        this.http.get<FixedCommitment[]>(
          joinUrl(request.apiBaseUrl, '/fixed-commitments'),
        ),
      defaultValue: [],
    });
  }

  createFixedCommitment(request: CreateFixedCommitmentRequest) {
    return this.http.post<FixedCommitment>(
      joinUrl(this.config.apiBaseUrl(), '/fixed-commitments'),
      request,
    );
  }

  updateFixedCommitment(
    commitmentId: string,
    request: UpdateFixedCommitmentRequest,
  ) {
    return this.http.put<FixedCommitment>(
      joinUrl(this.config.apiBaseUrl(), `/fixed-commitments/${commitmentId}`),
      request,
    );
  }

  deleteFixedCommitment(commitmentId: string) {
    return this.http.delete(
      joinUrl(this.config.apiBaseUrl(), `/fixed-commitments/${commitmentId}`),
    );
  }

  getSavingGoals() {
    return rxResource<SavingGoal[], { apiBaseUrl: string }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
      }),
      loader: ({ request }) =>
        this.http.get<SavingGoal[]>(joinUrl(request.apiBaseUrl, '/savings-goals')),
      defaultValue: [],
    });
  }

  getActiveSavingGoals() {
    return rxResource<SavingGoal[], { apiBaseUrl: string }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
      }),
      loader: ({ request }) =>
        this.http.get<SavingGoal[]>(
          joinUrl(request.apiBaseUrl, '/savings-goals?activeOnly=true'),
        ),
      defaultValue: [],
    });
  }

  createSavingGoal(request: CreateSavingGoalRequest) {
    return this.http.post<SavingGoal>(
      joinUrl(this.config.apiBaseUrl(), '/savings-goals'),
      request,
    );
  }

  updateSavingGoal(goalId: string, request: UpdateSavingGoalRequest) {
    return this.http.put<SavingGoal>(
      joinUrl(this.config.apiBaseUrl(), `/savings-goals/${goalId}`),
      request,
    );
  }

  deleteSavingGoal(goalId: string) {
    return this.http.delete(
      joinUrl(this.config.apiBaseUrl(), `/savings-goals/${goalId}`),
    );
  }

  getUser() {
    return rxResource<User | null, { apiBaseUrl: string }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
      }),
      loader: ({ request }) =>
        this.http.get<User>(joinUrl(request.apiBaseUrl, '/user/me')),
      defaultValue: null,
    });
  }

  updateMonthlyGoalSavings(goalMonthlySavings: number) {
    const payload: UpdateMonthlyGoalSavingsRequest = {
      goalMonthlySavings,
    };

    return this.http.put<User>(
      joinUrl(this.config.apiBaseUrl(), '/user/me/monthly-goal-savings'),
      payload,
    );
  }

  getSavingsLogs() {
    return rxResource<SavingsLog[], { apiBaseUrl: string }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
      }),
      loader: ({ request }) =>
        this.http.get<SavingsLog[]>(joinUrl(request.apiBaseUrl, '/savings-logs')),
      defaultValue: [],
    });
  }

  confirmSavingsLog(period: string, confirmedAmount?: number, status?: SavingsLogStatus) {
    const payload: ConfirmSavingsLogDto = {
      period,
      ...(confirmedAmount !== undefined ? { confirmedAmount } : {}),
      ...(status ? { status } : {}),
    };

    return this.http.post<SavingsLog>(
      joinUrl(this.config.apiBaseUrl(), '/savings-logs/confirm'),
      payload,
    );
  }
}
