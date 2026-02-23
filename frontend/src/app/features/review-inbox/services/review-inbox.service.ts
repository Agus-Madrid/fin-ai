import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../core/config/app-config.service';
import { CreateTransactionRequest } from '../../../shared/models/transaction-create.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewInboxService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  
  constructor() { }

  confirmTransaction(id: number | string, payload: CreateTransactionRequest) {
    const apiBaseUrl = this.config.apiBaseUrl();
    return this.http.put(`${apiBaseUrl}/review-inbox/${id}/confirm`, payload);
  }
}
