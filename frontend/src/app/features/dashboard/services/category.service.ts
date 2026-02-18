import { computed, Injectable, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Category } from '../../../shared/models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = '/categories';
  private readonly userId = signal<string | null>(null);
  private readonly selectedCategoryId = signal<string | null>(null);

  readonly categoriesResource = httpResource<Category[]>(() => {
    const userId = this.userId();
    return userId ? `${this.baseUrl}/user/${userId}` : this.baseUrl;
  }, {
    defaultValue: []
  });

  readonly categories = computed(() => this.categoriesResource.value());

  readonly categoryResource = httpResource<Category | undefined>(() => {
    const id = this.selectedCategoryId();
    return id ? `${this.baseUrl}/${id}` : undefined;
  });

  setUserId(id: string | null) {
    this.userId.set(id);
  }

  selectCategory(id: string | null) {
    this.selectedCategoryId.set(id);
  }

  reloadCategories() {
    this.categoriesResource.reload();
  }

  reloadCategory() {
    this.categoryResource.reload();
  }
}
