import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { FakeAuthService } from '../../../core/auth/fake-auth.service';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import { CreateTransactionDto, CreateTransactionRequest } from '../../../shared/models/transaction-create.model';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(FakeAuthService);
  private readonly config = inject(AppConfigService);

  getTransactions() {
    return rxResource<Transaction[], { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<Transaction[]>(
          joinUrl(request.apiBaseUrl, `/transactions/user/${request.userId}`)
        ),
      defaultValue: []
    });
  }

  getTransactionsByStatus(status: TransactionStatus){
    return rxResource<Transaction[], { userId: string, apiBaseUrl: string, status: TransactionStatus }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl(),
        status
      }),
      loader: ({ request }) =>
        this.http.get<Transaction[]>(
          joinUrl(request.apiBaseUrl, `/transactions/user/${request.userId}?status=${request.status}`)
        )
      })
  }

  getLatestTransactions(limit: number = 5){
    return rxResource<Transaction[], { userId: string, apiBaseUrl: string, limit: number }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl(),
        limit
      }),
      loader: ({ request }) =>
        this.http.get<Transaction[]>(
          joinUrl(request.apiBaseUrl, `/transactions/user/${request.userId}/latest?limit=${request.limit}`)
        ),
      defaultValue: []
    });
  }

  create(request: CreateTransactionRequest) {
    const payload: CreateTransactionDto = {
      ...request,
      userId: this.auth.ensureUserId(),
      status: TransactionStatus.CONFIRMED
    };

    return this.http.post(
      joinUrl(this.config.apiBaseUrl(), '/transactions'),
      payload
    );
  }
}
