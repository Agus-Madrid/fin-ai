import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AppConfigService } from '../../../core/config/app-config.service';
import { TransactionService } from '../../dashboard/services/transaction.service';
import { CreateTransactionRequest } from '../../../shared/models/transaction-create.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewInboxService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly transactionService = inject(TransactionService);
  
  constructor() { }

  confirmTransaction(id: number | string, payload: CreateTransactionRequest) {
    const apiBaseUrl = this.config.apiBaseUrl();
    return this.http
      .put(`${apiBaseUrl}/review-inbox/${id}/confirm`, payload)
      .pipe(tap(() => this.transactionService.reloadTransactions()));
  }

  confirmMany(ids: number[] | string[]) {
    const apiBaseUrl = this.config.apiBaseUrl();
    return this.http
      .put(`${apiBaseUrl}/review-inbox/confirm-many`, ids)
      .pipe(tap(() => this.transactionService.reloadTransactions()));
  }
}
