import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { InboxVm } from '../../../shared/models/inbox.model';

@Component({
  selector: 'app-review-inbox-view',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  templateUrl: './review-inbox.view.component.html',
  styleUrl: './review-inbox.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewInboxViewComponent {
  @Input({ required: true }) vm!: InboxVm;

  getConfidenceLabel(confidence: string) {
    if (confidence === 'low') {
      return 'Baja';
    }
    if (confidence === 'high') {
      return 'Alta';
    }
    return 'Media';
  }
}
