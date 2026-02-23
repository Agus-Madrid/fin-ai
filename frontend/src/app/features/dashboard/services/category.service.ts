import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxResource } from '@angular/core/rxjs-interop';
import { Category } from '../../../shared/models/category.model';
import { FakeAuthService } from '../../../core/auth/fake-auth.service';
import { AppConfigService } from '../../../core/config/app-config.service';
import { joinUrl } from '../../../core/http/url.util';
import {
  CreateCategoryDto,
  CreateCategoryRequest
} from '../../../shared/models/category-create.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(FakeAuthService);
  private readonly config = inject(AppConfigService);

  getCategories() {
    return rxResource<Category[], { userId: string; apiBaseUrl: string }>({
      request: () => ({
        userId: this.auth.ensureUserId(),
        apiBaseUrl: this.config.apiBaseUrl()
      }),
      loader: ({ request }) =>
        this.http.get<Category[]>(
          joinUrl(request.apiBaseUrl, `/categories/user/${request.userId}`)
        ),
      defaultValue: []
    });
  }

  create(request: CreateCategoryRequest) {
    const payload: CreateCategoryDto = {
      ...request,
      userId: this.auth.ensureUserId()
    };

    return this.http.post<Category>(
      joinUrl(this.config.apiBaseUrl(), '/categories'),
      payload
    );
  }

  update(categoryId: string, request: CreateCategoryRequest) {
    return this.http.put<Category>(
      joinUrl(this.config.apiBaseUrl(), `/categories/${categoryId}`),
      request
    );
  }
}
