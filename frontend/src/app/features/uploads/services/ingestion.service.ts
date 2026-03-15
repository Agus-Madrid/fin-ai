import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import { UploadIngestionResponse } from '../../../shared/models/upload-ingestion-response.model';

@Injectable({ providedIn: 'root' })
export class IngestionService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  processUpload(uploadId: string) {
    return this.http.post<UploadIngestionResponse>(
      joinUrl(this.config.apiBaseUrl(), `/ingestion/uploads/${uploadId}/process`),
      {},
    );
  }
}
