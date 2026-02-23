import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { InboxItem, InboxState } from '../../../shared/models/inbox.model';

@Component({
  selector: 'app-review-inbox-view',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe],
  templateUrl: './review-inbox.view.component.html',
  styleUrl: './review-inbox.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewInboxViewComponent {
  readonly inbox = input.required<InboxState>();
  @Output() readonly selectItem = new EventEmitter<InboxItem>();

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
