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
import { CategoryService } from '../../dashboard/services/category.service';
import { Category } from '../../../shared/models/category.model';
import { CreateCategoryRequest } from '../../../shared/models/category-create.model';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { config } from 'rxjs/internal/config';

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
  private readonly modalService = inject(NgbModal);

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

    this.categoryService.create(request).subscribe({
      next: () => {
        this.categoriesResource.reload();
        this.createForm.reset({
          name: '',
          icon: DEFAULT_ICON,
          color: DEFAULT_COLOR
        });
      },
      error: (error) => {
        console.error('Failed to create category', error);
      }
    });
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

  async handleSaveConfirmation(confirmed: boolean, modalRef: NgbModalRef, category: Category) {
    if (!this.canSaveCategory(category)) {
      return;
    }

    if (!confirmed) {
      modalRef.dismiss('cancel');
      return;
    }

    const draft = this.drafts()[category.id];
    if (!draft) {
      return;
    }
    this.categoryService.update(category.id, this.toRequest(draft)).subscribe({
      next: () => {
        modalRef.close(true);
        this.categoriesResource.reload();
      },
      error: (error) => {
        console.error('Failed to update category', error);
        modalRef.dismiss('update_error');
      }
    });
  }

  async handleDeleteConfirmation(confirmed: boolean, modalRef: NgbModalRef, category: Category) {
    if (!confirmed) {
      modalRef.dismiss('cancel');
      return;
    }

    this.categoryService.delete(category.id).subscribe({
      next: () => {
        modalRef.close(true);
        this.categoriesResource.reload();
      },
      error: (error) => {
        console.error('Failed to delete category', error);
        modalRef.dismiss('delete_error');
      }
    });
  }

  confirmDeleteCategory(category: Category) {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.title = 'Estás por eliminar una categoría';
    modalRef.componentInstance.message = `¿Confirma que desea eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`;
    modalRef.componentInstance.cancelText = 'Cancelar';
    modalRef.componentInstance.confirmText = 'Eliminar';
    modalRef.componentInstance.tone = 'danger';

    modalRef.componentInstance.confirmRequested.subscribe(() => this.handleDeleteConfirmation(true, modalRef, category));
    modalRef.componentInstance.dismissRequested.subscribe(() => this.handleDeleteConfirmation(false, modalRef, category));
  }

  confirmSaveCategory(category: Category) {
    const modalRef = this.modalService.open(ConfirmModalComponent, {
      size: 'md',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.title = 'Confirmar cambios';
    modalRef.componentInstance.message = `¿Confirma que desea guardar los cambios realizados a la categoría "${category.name}"?`;
    modalRef.componentInstance.cancelText = 'Cancelar';
    modalRef.componentInstance.confirmText = 'Guardar';
    modalRef.componentInstance.tone = 'primary';
    modalRef.componentInstance.confirmRequested.subscribe(() => this.handleSaveConfirmation(true, modalRef, category));
    modalRef.componentInstance.dismissRequested.subscribe(() => this.handleSaveConfirmation(false, modalRef, category));
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
