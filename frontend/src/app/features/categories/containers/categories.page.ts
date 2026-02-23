import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CategoryService } from '../../dashboard/services/category.service';
import { Category } from '../../../shared/models/category.model';
import { CreateCategoryRequest } from '../../../shared/models/category-create.model';

const DEFAULT_ICON = '💵';
const DEFAULT_COLOR = '#64748b';

interface CategoryDraft {
  name: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoriesPageComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder);

  readonly categoriesResource = this.categoryService.getCategories();
  readonly categories = computed(() => this.categoriesResource.value() ?? []);
  readonly drafts = signal<Partial<Record<string, CategoryDraft>>>({});

  readonly createForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    icon: [DEFAULT_ICON, [Validators.required, Validators.maxLength(8)]],
    color: [DEFAULT_COLOR, [Validators.required]]
  });

  constructor() {
    effect(() => {
      const nextDrafts = this.categories().reduce<Partial<Record<string, CategoryDraft>>>(
        (acc, category) => {
          acc[category.id] = this.toDraft(category);
          return acc;
        },
        {}
      );
      this.drafts.set(nextDrafts);
    });
  }

  async createCategory() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const formValue = this.createForm.getRawValue();
    const request = this.toRequest(formValue);

    try {
      await firstValueFrom(this.categoryService.create(request));
      this.createForm.reset({
        name: '',
        icon: DEFAULT_ICON,
        color: DEFAULT_COLOR
      });
      this.categoriesResource.reload();
    } catch {
      return;
    }
  }

  onDraftInput(categoryId: string, field: keyof CategoryDraft, event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.updateDraftField(categoryId, field, input?.value ?? '');
  }

  onCreateColorInput(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.createForm.controls.color.setValue(input?.value ?? DEFAULT_COLOR);
  }

  canSaveCategory(category: Category): boolean {
    const draft = this.drafts()[category.id];
    if (!draft) {
      return false;
    }

    const normalized = this.toRequest(draft);
    return (
      normalized.name !== category.name ||
      normalized.icon !== category.icon ||
      normalized.color !== category.color
    );
  }

  async saveCategory(category: Category) {
    if (!this.canSaveCategory(category)) {
      return;
    }

    const draft = this.drafts()[category.id];
    if (!draft) {
      return;
    }

    try {
      await firstValueFrom(this.categoryService.update(category.id, this.toRequest(draft)));
      this.categoriesResource.reload();
    } catch {
      return;
    }
  }

  trackByCategoryId(_: number, category: Category) {
    return category.id;
  }

  private updateDraftField(categoryId: string, field: keyof CategoryDraft, value: string) {
    this.drafts.update((current) => {
      const draft = current[categoryId];
      if (!draft) {
        return current;
      }

      return {
        ...current,
        [categoryId]: {
          ...draft,
          [field]: value
        }
      };
    });
  }

  private toDraft(category: Category): CategoryDraft {
    return {
      name: category.name,
      icon: category.icon || DEFAULT_ICON,
      color: category.color || DEFAULT_COLOR
    };
  }

  private toRequest(draft: CategoryDraft): CreateCategoryRequest {
    return {
      name: draft.name.trim(),
      icon: draft.icon.trim() || DEFAULT_ICON,
      color: draft.color.trim() || DEFAULT_COLOR
    };
  }
}
