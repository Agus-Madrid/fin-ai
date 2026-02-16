import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { UploadVm, UploadStatus } from '../../../shared/models/upload.model';

@Component({
  selector: 'app-uploads-view',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './uploads.view.component.html',
  styleUrl: './uploads.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadsViewComponent {
  @Input({ required: true }) vm!: UploadVm;

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
