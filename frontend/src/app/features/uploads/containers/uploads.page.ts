import { AsyncPipe, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UploadsDataService } from '../../../core/data/uploads-data.service';
import { IngestionService } from '../services/ingestion.service';
import { UploadsViewComponent } from '../presentational/uploads.view.component';

@Component({
  selector: 'app-uploads-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, UploadsViewComponent],
  template: `
    <ng-container *ngIf="uploadViewModel$ | async as uploadViewModel">
      <app-uploads-view
        [uploadViewModel]="uploadViewModel"
        [uploading]="uploading()"
        [processingUploadId]="processingUploadId()"
        [errorMessage]="errorMessage()"
        (uploadRequested)="onUploadRequested($event)"
        (processRequested)="onProcessRequested($event)"
        (openRequested)="onOpenRequested($event)"
      ></app-uploads-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadsPageComponent {
  private readonly data = inject(UploadsDataService);
  private readonly ingestionService = inject(IngestionService);
  readonly uploading = signal(false);
  readonly processingUploadId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly uploadViewModel$ = this.data.getUploadsViewModel();

  async onUploadRequested(file: File) {
    this.errorMessage.set(null);
    this.uploading.set(true);

    try {
      await firstValueFrom(this.data.uploadPdf(file));
    } catch (error: unknown) {
      this.errorMessage.set(this.resolveErrorMessage(error));
    } finally {
      this.uploading.set(false);
    }
  }

  async onOpenRequested(uploadId: string) {
    this.errorMessage.set(null);

    try {
      const blob = await firstValueFrom(this.data.getUploadFileBlob(uploadId));
      this.openBlobInNewTab(blob);
    } catch (error: unknown) {
      this.errorMessage.set(this.resolveErrorMessage(error));
    }
  }

  async onProcessRequested(uploadId: string) {
    this.errorMessage.set(null);
    this.processingUploadId.set(uploadId);

    try {
      await firstValueFrom(this.ingestionService.processUpload(uploadId));
      this.data.reloadUploads();
    } catch (error: unknown) {
      this.errorMessage.set(this.resolveErrorMessage(error));
    } finally {
      this.processingUploadId.set(null);
    }
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const message = this.readBackendMessage(error.error);
      if (message) {
        return message;
      }
      return 'No fue posible completar la operacion con el archivo PDF.';
    }

    return 'No fue posible completar la operacion con el archivo PDF.';
  }

  private readBackendMessage(errorBody: unknown): string | null {
    if (!errorBody || typeof errorBody !== 'object') {
      return null;
    }

    const body = errorBody as {
      message?: string | string[];
    };

    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }

    if (typeof body.message === 'string') {
      return body.message;
    }

    return null;
  }

  private openBlobInNewTab(blob: Blob): void {
    const blobUrl = URL.createObjectURL(blob);
    const openedWindow = window.open(blobUrl, '_blank', 'noopener');
    if (!openedWindow) {
      URL.revokeObjectURL(blobUrl);
      throw new Error('Popup blocked');
    }

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 60_000);
  }
}
