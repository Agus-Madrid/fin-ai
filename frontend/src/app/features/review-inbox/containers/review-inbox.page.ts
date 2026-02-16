import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { InboxDataService } from '../../../core/data/inbox-data.service';
import { ReviewInboxViewComponent } from '../presentational/review-inbox.view.component';

@Component({
  selector: 'app-review-inbox-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, ReviewInboxViewComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <app-review-inbox-view [vm]="vm"></app-review-inbox-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewInboxPageComponent {
  private readonly data = inject(InboxDataService);
  readonly vm$ = this.data.getInboxVm();
}
