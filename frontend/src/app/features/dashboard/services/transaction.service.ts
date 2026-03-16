import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import {
  CreateTransactionDto,
  CreateTransactionRequest,
} from '../../../shared/models/transaction-create.model';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly transactionsReloadVersion = signal(0);

  getTransactions() {
    return rxResource<Transaction[], { apiBaseUrl: string; refreshVersion: number }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
        refreshVersion: this.transactionsReloadVersion()
      }),
      loader: ({ request }) =>
        this.http.get<Transaction[]>(joinUrl(request.apiBaseUrl, '/transactions')),
      defaultValue: [],
    });
  }

  getTransactionsByStatus(status: TransactionStatus) {
    return rxResource<Transaction[], { apiBaseUrl: string; status: TransactionStatus; refreshVersion: number }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
        status,
        refreshVersion: this.transactionsReloadVersion()
      }),
      loader: ({ request }) =>
        this.http.get<Transaction[]>(
          joinUrl(request.apiBaseUrl, `/transactions?status=${request.status}`),
        ),
      defaultValue: [],
    });
  }

  getLatestTransactions(limit: number = 5) {
    return rxResource<Transaction[], { apiBaseUrl: string; limit: number; refreshVersion: number }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
        limit,
        refreshVersion: this.transactionsReloadVersion()
      }),
      loader: ({ request }) =>
        this.http.get<Transaction[]>(
          joinUrl(request.apiBaseUrl, `/transactions/latest?limit=${request.limit}`),
        ),
      defaultValue: [],
    });
  }

  reloadTransactions(): void {
    this.transactionsReloadVersion.update((current) => current + 1);
  }

  create(request: CreateTransactionRequest) {
    const payload: CreateTransactionDto = {
      ...request,
      status: TransactionStatus.CONFIRMED,
    };

    return this.http
      .post(joinUrl(this.config.apiBaseUrl(), '/transactions'), payload)
      .pipe(tap(() => this.reloadTransactions()));
  }

  update(transactionId: string, request: CreateTransactionRequest) {
    const payload: CreateTransactionDto = {
      ...request,
      status: TransactionStatus.CONFIRMED,
    };

    return this.http
      .put(
        joinUrl(this.config.apiBaseUrl(), `/transactions/${transactionId}`),
        payload,
      )
      .pipe(tap(() => this.reloadTransactions()));
  }

  delete(transactionId: string) {
    return this.http
      .delete(joinUrl(this.config.apiBaseUrl(), `/transactions/${transactionId}`))
      .pipe(tap(() => this.reloadTransactions()));
  }
}
