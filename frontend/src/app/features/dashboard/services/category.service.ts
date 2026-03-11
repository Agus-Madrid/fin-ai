import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Category } from '../../../shared/models/category.model';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import { CreateCategoryRequest } from '../../../shared/models/category-create.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  getCategories() {
    return rxResource<Category[], { apiBaseUrl: string }>({
      request: () => ({
        apiBaseUrl: this.config.apiBaseUrl(),
      }),
      loader: ({ request }) =>
        this.http.get<Category[]>(joinUrl(request.apiBaseUrl, '/categories')),
      defaultValue: [],
    });
  }

  create(request: CreateCategoryRequest) {
    return this.http.post<Category>(
      joinUrl(this.config.apiBaseUrl(), '/categories'),
      request,
    );
  }

  update(categoryId: string, request: CreateCategoryRequest) {
    return this.http.put<Category>(
      joinUrl(this.config.apiBaseUrl(), `/categories/${categoryId}`),
      request,
    );
  }
}
