import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import { UploadIngestionResponse } from '../../../shared/models/upload-ingestion-response.model';
import { TransactionService } from '../../dashboard/services/transaction.service';

@Injectable({ providedIn: 'root' })
export class IngestionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly transactionService = inject(TransactionService);

  processUpload(uploadId: string) {
    return this.http
      .post<UploadIngestionResponse>(
        joinUrl(this.config.apiBaseUrl(), `/ingestion/uploads/${uploadId}/process`),
        {},
      )
      .pipe(tap(() => this.transactionService.reloadTransactions()));
  }
}
