import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import { BudgetOverview } from '../../../shared/models/budget-overview.model';

@Injectable({ providedIn: 'root' })
export class BudgetOverviewService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  getOverview() {
    return rxResource<BudgetOverview | null, { apiBaseUrl: string }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
      }),
      loader: ({ request }) =>
        this.http.get<BudgetOverview>(
          joinUrl(request.apiBaseUrl, '/budgets/overview'),
        ),
      defaultValue: null,
    });
  }
}
