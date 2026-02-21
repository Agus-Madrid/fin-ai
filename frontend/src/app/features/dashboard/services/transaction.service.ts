import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { FakeAuthService } from '../../../core/auth/fake-auth.service';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import { CreateTransactionDto, CreateTransactionRequest, TransactionStatus } from '../../../shared/models/transaction-create.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(FakeAuthService);
  private readonly config = inject(AppConfigService);

  getTransactions() {
    return rxResource<unknown[], { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<unknown[]>(
          joinUrl(request.apiBaseUrl, `/transactions/user/${request.userId}`)
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
