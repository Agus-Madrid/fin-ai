import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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

  getStatusLabel(status: UploadStatus) {
    if (status === 'processed') {
      return 'Procesado';
    }
    if (status === 'error') {
      return 'Error';
    }
    return 'Pendiente';
  }
}
