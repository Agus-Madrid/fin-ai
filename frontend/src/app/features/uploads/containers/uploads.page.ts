import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UploadsDataService } from '../../../core/data/uploads-data.service';
import { UploadsViewComponent } from '../presentational/uploads.view.component';

@Component({
  selector: 'app-uploads-page',
  standalone: true,
  imports: [AsyncPipe, NgIf, UploadsViewComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <app-uploads-view [vm]="vm"></app-uploads-view>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadsPageComponent {
  private readonly data = inject(UploadsDataService);
  readonly vm$ = this.data.getUploadsVm();
}
