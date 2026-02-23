import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { InboxItem, InboxState } from '../../../shared/models/inbox.model';
import { ReviewInboxForm } from '../models/review-inbox-form.model';

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
  readonly form = input.required<ReviewInboxForm>();

  selectItem = output<InboxItem>();
  formChange = output<Partial<ReviewInboxForm>>();
  confirmTransaction = output<void>();

  getConfidenceLabel(confidence: string) {
    if (confidence === 'low') {
      return 'Baja';
    }
    if (confidence === 'high') {
      return 'Alta';
    }
    return 'Media';
  }

  onConfirmTransaction() {
    this.confirmTransaction.emit();
  }

  onSelectItem(item: InboxItem) {
    this.selectItem.emit(item);
  }

  onFieldChange(field: keyof ReviewInboxForm, value: string) {
    this.formChange.emit({ [field]: value });
  }
}
