import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AppConfigService } from '../../../core/config/app-config.service';
import { FakeAuthService } from '../../../core/auth/fake-auth.service';
import { joinUrl } from '../../../core/http/url.util';
import { CreateIncomeDto, CreateIncomeRequest, UpdateIncomeRequest } from '../../../shared/models/income-create.model';
import { Income } from '../../../shared/models/income.model';
import { FixedCommitment } from '../../../shared/models/fixed-commitment.model';
import {
  CreateFixedCommitmentDto,
  CreateFixedCommitmentRequest,
  UpdateFixedCommitmentRequest
} from '../../../shared/models/fixed-commitment-create.model';
import { User } from '../../../shared/models/user.model';
import { SavingsLog, SavingsLogStatus } from '../../../shared/models/savings-log.model';
import { SavingGoal } from '../../../shared/models/saving-goal.model';
import {
  CreateSavingGoalDto,
  CreateSavingGoalRequest,
  UpdateSavingGoalRequest
} from '../../../shared/models/saving-goal-create.model';

interface UpdateMonthlyGoalSavingsRequest {
  goalMonthlySavings: number;
}

interface ConfirmSavingsLogDto {
  userId: string;
  period: string;
  confirmedAmount?: number;
  status?: SavingsLogStatus;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetPlannerService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly auth = inject(FakeAuthService);

  getIncomes() {
    return rxResource<Income[], { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<Income[]>(
          joinUrl(request.apiBaseUrl, `/incomes/user/${request.userId}`)
        ),
      defaultValue: []
    });
  }

  createIncome(request: CreateIncomeRequest) {
    const payload: CreateIncomeDto = {
      ...request,
      userId: this.auth.ensureUserId()
    };

    return this.http.post<Income>(
      joinUrl(this.config.apiBaseUrl(), '/incomes'),
      payload
    );
  }

  updateIncome(incomeId: string, request: UpdateIncomeRequest) {
    return this.http.put<Income>(
      joinUrl(this.config.apiBaseUrl(), `/incomes/${incomeId}`),
      request
    );
  }

  deleteIncome(incomeId: string) {
    return this.http.delete(
      joinUrl(this.config.apiBaseUrl(), `/incomes/${incomeId}`)
    );
  }

  getFixedCommitments() {
    return rxResource<FixedCommitment[], { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<FixedCommitment[]>(
          joinUrl(request.apiBaseUrl, `/fixed-commitments/user/${request.userId}`)
        ),
      defaultValue: []
    });
  }

  createFixedCommitment(request: CreateFixedCommitmentRequest) {
    const payload: CreateFixedCommitmentDto = {
      ...request,
      userId: this.auth.ensureUserId()
    };

    return this.http.post<FixedCommitment>(
      joinUrl(this.config.apiBaseUrl(), '/fixed-commitments'),
      payload
    );
  }

  updateFixedCommitment(commitmentId: string, request: UpdateFixedCommitmentRequest) {
    return this.http.put<FixedCommitment>(
      joinUrl(this.config.apiBaseUrl(), `/fixed-commitments/${commitmentId}`),
      request
    );
  }

  deleteFixedCommitment(commitmentId: string) {
    return this.http.delete(
      joinUrl(this.config.apiBaseUrl(), `/fixed-commitments/${commitmentId}`)
    );
  }

  getSavingGoals() {
    return rxResource<SavingGoal[], { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<SavingGoal[]>(
          joinUrl(request.apiBaseUrl, `/savings-goals/user/${request.userId}`)
        ),
      defaultValue: []
    });
  }

  getActiveSavingGoals() {
    return rxResource<SavingGoal[], { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<SavingGoal[]>(
          joinUrl(request.apiBaseUrl, `/savings-goals/user/${request.userId}?activeOnly=true`)
        ),
      defaultValue: []
    });
  }

  createSavingGoal(request: CreateSavingGoalRequest) {
    const payload: CreateSavingGoalDto = {
      ...request,
      userId: this.auth.ensureUserId()
    };

    return this.http.post<SavingGoal>(
      joinUrl(this.config.apiBaseUrl(), '/savings-goals'),
      payload
    );
  }

  updateSavingGoal(goalId: string, request: UpdateSavingGoalRequest) {
    return this.http.put<SavingGoal>(
      joinUrl(this.config.apiBaseUrl(), `/savings-goals/${goalId}`),
      request
    );
  }

  deleteSavingGoal(goalId: string) {
    return this.http.delete(
      joinUrl(this.config.apiBaseUrl(), `/savings-goals/${goalId}`)
    );
  }

  getUser() {
    return rxResource<User | null, { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<User>(
          joinUrl(request.apiBaseUrl, `/user/${request.userId}`)
        ),
      defaultValue: null
    });
  }

  updateMonthlyGoalSavings(goalMonthlySavings: number) {
    const payload: UpdateMonthlyGoalSavingsRequest = {
      goalMonthlySavings
    };

    return this.http.put<User>(
      joinUrl(this.config.apiBaseUrl(), `/user/${this.auth.ensureUserId()}/monthly-goal-savings`),
      payload
    );
  }

  getSavingsLogs() {
    return rxResource<SavingsLog[], { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<SavingsLog[]>(
          joinUrl(request.apiBaseUrl, `/savings-logs/user/${request.userId}`)
        ),
      defaultValue: []
    });
  }

  confirmSavingsLog(period: string, confirmedAmount?: number, status?: SavingsLogStatus) {
    const payload: ConfirmSavingsLogDto = {
      userId: this.auth.ensureUserId(),
      period,
      ...(confirmedAmount !== undefined ? { confirmedAmount } : {}),
      ...(status ? { status } : {})
    };

    return this.http.post<SavingsLog>(
      joinUrl(this.config.apiBaseUrl(), '/savings-logs/confirm'),
      payload
    );
  }
}
