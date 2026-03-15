import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { joinUrl } from '../http/url.util';
import { UploadApiModel } from '../../shared/models/upload-api.model';
import { UploadItem, UploadStatus, UploadViewModel } from '../../shared/models/upload.model';

@Injectable({ providedIn: 'root' })
export class UploadsDataService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);
  private readonly reloadTrigger$ = new BehaviorSubject<void>(undefined);

  getUploadsViewModel(): Observable<UploadViewModel> {
    return this.reloadTrigger$.pipe(
      switchMap(() =>
        this.http
          .get<UploadApiModel[]>(joinUrl(this.config.apiBaseUrl(), '/uploads'))
          .pipe(catchError(() => of([])))
      ),
      map((uploads) => ({
        uploads: uploads.map((upload) => this.toViewModel(upload))
      })),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  uploadPdf(file: File): Observable<UploadApiModel> {
    const payload = new FormData();
    payload.append('file', file, file.name);

    return this.http
      .post<UploadApiModel>(joinUrl(this.config.apiBaseUrl(), '/uploads'), payload)
      .pipe(tap(() => this.reloadTrigger$.next()));
  }

  getUploadFileBlob(uploadId: string): Observable<Blob> {
    return this.http.get(joinUrl(this.config.apiBaseUrl(), `/uploads/${uploadId}/file`), {
      responseType: 'blob'
    });
  }

  reloadUploads(): void {
    this.reloadTrigger$.next(undefined);
  }

  private toViewModel(upload: UploadApiModel): UploadItem {
    return {
      id: upload.id,
      name: upload.filename,
      sizeLabel: this.formatSize(upload.sizeBytes),
      uploadedLabel: this.formatUploadedLabel(upload.createdAt),
      status: this.mapStatus(upload.status),
      fileUrl: this.toAbsoluteUrl(upload.fileUrl)
    };
  }

  private mapStatus(status: UploadApiModel['status']): UploadStatus {
    if (status === 'COMPLETED' || status === 'PROCESSED') {
      return 'processed';
    }
    if (status === 'FAILED') {
      return 'error';
    }
    return 'pending';
  }

  private formatSize(sizeBytes: number): string {
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return '0 B';
    }

    if (sizeBytes < 1024) {
      return `${sizeBytes} B`;
    }

    if (sizeBytes < 1024 * 1024) {
      return `${(sizeBytes / 1024).toFixed(1)} KB`;
    }

    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private formatUploadedLabel(createdAt: string): string {
    const createdAtDate = new Date(createdAt);
    if (Number.isNaN(createdAtDate.getTime())) {
      return 'Sin fecha';
    }

    const elapsedMs = Date.now() - createdAtDate.getTime();
    const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

    if (elapsedMinutes < 1) {
      return 'Hace menos de 1 min';
    }

    if (elapsedMinutes < 60) {
      return `Hace ${elapsedMinutes} min`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
      return `Hace ${elapsedHours} h`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    if (elapsedDays <= 7) {
      return `Hace ${elapsedDays} d`;
    }

    return createdAtDate.toLocaleDateString('es-UY');
  }

  private toAbsoluteUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    return joinUrl(this.config.apiBaseUrl(), path);
  }
}
