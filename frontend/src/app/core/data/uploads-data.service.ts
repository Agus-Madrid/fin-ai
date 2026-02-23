import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { UploadViewModel } from '../../shared/models/upload.model';

@Injectable({ providedIn: 'root' })
export class UploadsDataService {
  getUploadsViewModel() {
    const uploadViewModel: UploadViewModel = {
      uploads: [
        {
          id: 'up-1',
          name: 'Chase_Statement_Feb_2026.pdf',
          sizeLabel: '1.4 MB',
          uploadedLabel: 'Hace 2 mins',
          status: 'pending'
        },
        {
          id: 'up-2',
          name: 'Amex_Gold_Jan_2026.pdf',
          sizeLabel: '2.1 MB',
          uploadedLabel: 'Ayer',
          status: 'processed',
          extractedCount: 45
        },
        {
          id: 'up-3',
          name: 'BOA_Checking_Jan_2026.pdf',
          sizeLabel: '0.8 MB',
          uploadedLabel: '12 Feb',
          status: 'processed',
          extractedCount: 12
        },
        {
          id: 'up-4',
          name: 'Unknown_Receipt_Scanned.png',
          sizeLabel: '5.2 MB',
          uploadedLabel: '10 Feb',
          status: 'error'
        },
        {
          id: 'up-5',
          name: 'Citi_DoubleCash_Dec_2025.pdf',
          sizeLabel: '1.9 MB',
          uploadedLabel: '28 Ene',
          status: 'processed',
          extractedCount: 89
        }
      ]
    };

    return of(uploadViewModel);
  }
}
