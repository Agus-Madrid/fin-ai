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
}
