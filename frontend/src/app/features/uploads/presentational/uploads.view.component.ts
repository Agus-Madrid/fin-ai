import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { UploadViewModel, UploadStatus } from '../../../shared/models/upload.model';

@Component({
  selector: 'app-uploads-view',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './uploads.view.component.html',
  styleUrl: './uploads.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadsViewComponent {
  readonly uploadViewModel = input.required<UploadViewModel>();
  readonly uploading = input(false);
  readonly processingUploadId = input<string | null>(null);
  readonly errorMessage = input<string | null>(null);
  readonly uploadRequested = output<File>();
  readonly processRequested = output<string>();
  readonly openRequested = output<string>();
  readonly isDragging = signal(false);

  getStatusLabel(status: UploadStatus) {
    if (status === 'processed') {
      return 'Procesado';
    }
    if (status === 'error') {
      return 'Error';
    }
    return 'Pendiente';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (this.uploading()) {
      return;
    }
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (this.uploading()) {
      return;
    }

    const file = event.dataTransfer?.files?.item(0);
    if (file) {
      this.uploadRequested.emit(file);
    }
  }

  onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0);
    if (file) {
      this.uploadRequested.emit(file);
    }

    if (input) {
      input.value = '';
    }
  }

  onOpenRequested(uploadId: string) {
    this.openRequested.emit(uploadId);
  }

  onProcessRequested(uploadId: string) {
    this.processRequested.emit(uploadId);
  }

  isProcessing(uploadId: string): boolean {
    return this.processingUploadId() === uploadId;
  }
}
