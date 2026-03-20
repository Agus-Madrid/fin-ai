import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  ResourceRef,
  signal,
} from '@angular/core';
import { CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { TransactionStatus } from '../../../shared/enum/transaction-status.enum';
import { Transaction } from '../../../shared/models/transaction.model';
import { Category } from '../../../shared/models/category.model';

type TransactionSortField = 'date' | 'amount';
type TransactionSortDirection = 'ASC' | 'DESC';
type ActiveFilterKey = 'category' | 'amountMin' | 'amountMax' | 'dateFrom' | 'dateTo';

interface ActiveFilterChip {
  key: ActiveFilterKey;
  label: string;
}

interface CategoryFilterOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-transactions-view',
  standalone: true,
  imports: [CurrencyPipe, NgFor, NgIf, NgbPaginationModule],
  templateUrl: './transactions.view.component.html',
  styleUrl: './transactions.view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransactionsViewComponent {
  TransactionStatus = TransactionStatus;

  readonly createRequested = output<void>();
  readonly editRequested = output<Transaction>();
  readonly deleteRequested = output<Transaction>();
  readonly transactions = input.required<ResourceRef<Transaction[] | undefined>>();
  readonly categories = input<Category[]>([]);

  readonly availablePageSizes = [10, 25, 50] as const;
  readonly filtersVisible = signal(false);
  readonly selectedCategoryId = signal('');
  readonly amountMin = signal<number | null>(null);
  readonly amountMax = signal<number | null>(null);
  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly sortField = signal<TransactionSortField>('date');
  readonly sortDirection = signal<TransactionSortDirection>('DESC');
  readonly currentPage = signal(1);
  readonly pageSize = signal<number>(this.availablePageSizes[0]);

  readonly categoryOptions = computed(() => this.buildCategoryOptions());
  readonly filteredTransactions = computed(() =>
    this.filterTransactions(this.transactions().value() ?? []),
  );
  readonly sortedTransactions = computed(() =>
    this.sortTransactions(
      this.filteredTransactions(),
      this.sortField(),
      this.sortDirection(),
    ),
  );
  readonly totalFilteredTransactions = computed(() => this.sortedTransactions().length);
  readonly paginatedTransactions = computed(() =>
    this.paginateTransactions(
      this.sortedTransactions(),
      this.currentPage(),
      this.pageSize(),
    ),
  );
  readonly activeFilterChips = computed(() => this.buildActiveFilterChips());
  readonly hasActiveFilters = computed(() => this.activeFilterChips().length > 0);

  constructor() {
    effect(
      () => {
        this.selectedCategoryId();
        this.amountMin();
        this.amountMax();
        this.dateFrom();
        this.dateTo();
        this.sortField();
        this.sortDirection();
        this.pageSize();
        this.currentPage.set(1);
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const maxPage = this.getMaxPage(this.totalFilteredTransactions(), this.pageSize());
        if (this.currentPage() > maxPage) {
          this.currentPage.set(maxPage);
        }
      },
      { allowSignalWrites: true },
    );
  }

  createTransaction(): void {
    this.createRequested.emit();
  }

  editTransaction(tx: Transaction) {
    this.editRequested.emit(tx);
  }

  deleteTransaction(tx: Transaction) {
    this.deleteRequested.emit(tx);
  }

  toggleFiltersPanel(): void {
    this.filtersVisible.update((current) => !current);
  }

  openFiltersPanel(): void {
    this.filtersVisible.set(true);
  }

  closeFiltersPanel(): void {
    this.filtersVisible.set(false);
  }

  toggleSortDirection(): void {
    this.sortDirection.update((current) => (current === 'ASC' ? 'DESC' : 'ASC'));
  }

  onSortFieldChange(rawValue: string): void {
    if (rawValue === 'date' || rawValue === 'amount') {
      this.sortField.set(rawValue);
    }
  }

  onCategoryFilterChange(rawValue: string): void {
    this.selectedCategoryId.set(rawValue.trim());
  }

  onAmountMinFilterChange(rawValue: string): void {
    this.amountMin.set(this.parseOptionalNumber(rawValue));
  }

  onAmountMaxFilterChange(rawValue: string): void {
    this.amountMax.set(this.parseOptionalNumber(rawValue));
  }

  onDateFromFilterChange(rawValue: string): void {
    this.dateFrom.set(this.normalizeDateFilterValue(rawValue));
  }

  onDateToFilterChange(rawValue: string): void {
    this.dateTo.set(this.normalizeDateFilterValue(rawValue));
  }

  onPageChange(nextPage: number): void {
    this.currentPage.set(nextPage);
  }

  onPageSizeChange(rawValue: string): void {
    const parsedValue = Number(rawValue);
    if (!Number.isInteger(parsedValue) || !this.availablePageSizes.includes(parsedValue as 10 | 25 | 50)) {
      return;
    }

    this.pageSize.set(parsedValue);
  }

  removeActiveFilter(key: ActiveFilterKey): void {
    if (key === 'category') {
      this.selectedCategoryId.set('');
      return;
    }

    if (key === 'amountMin') {
      this.amountMin.set(null);
      return;
    }

    if (key === 'amountMax') {
      this.amountMax.set(null);
      return;
    }

    if (key === 'dateFrom') {
      this.dateFrom.set('');
      return;
    }

    this.dateTo.set('');
  }

  clearAllFilters(): void {
    this.selectedCategoryId.set('');
    this.amountMin.set(null);
    this.amountMax.set(null);
    this.dateFrom.set('');
    this.dateTo.set('');
  }

  getSortDirectionLabel(): string {
    return this.sortDirection();
  }

  getSortSummaryLabel(): string {
    const fieldLabel = this.sortField() === 'date' ? 'Fecha' : 'Monto';
    return `${fieldLabel} ${this.getSortDirectionLabel()}`;
  }

  getFilterResultsLabel(): string {
    const results = this.totalFilteredTransactions();
    return `${results} movimiento${results === 1 ? '' : 's'}`;
  }

  getCurrentPageFromIndex(): number {
    if (this.totalFilteredTransactions() === 0) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  getCurrentPageToIndex(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalFilteredTransactions());
  }

  getTransactionDateLabel(rawDate: Date | string): string {
    return this.formatDateValue(rawDate);
  }

  private buildCategoryOptions(): CategoryFilterOption[] {
    const categoryMap = new Map<string, CategoryFilterOption>();
    for (const category of this.categories() ?? []) {
      categoryMap.set(String(category.id), {
        id: String(category.id),
        name: category.name,
      });
    }

    let hasUncategorizedTransactions = false;
    for (const transaction of this.transactions().value() ?? []) {
      const categoryId = this.resolveTransactionCategoryId(transaction);
      const categoryName = transaction.category?.name?.trim();

      if (!categoryId) {
        hasUncategorizedTransactions = true;
        continue;
      }

      if (!categoryMap.has(categoryId) && categoryName) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
        });
      }
    }

    const sortedCategories = Array.from(categoryMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    if (hasUncategorizedTransactions) {
      sortedCategories.push({ id: 'uncategorized', name: 'Sin categoria' });
    }

    return sortedCategories;
  }

  private filterTransactions(transactions: Transaction[]): Transaction[] {
    return transactions.filter((transaction) => this.matchesAllFilters(transaction));
  }

  private matchesAllFilters(transaction: Transaction): boolean {
    return (
      this.matchesCategoryFilter(transaction) &&
      this.matchesAmountRangeFilter(transaction) &&
      this.matchesDateRangeFilter(transaction)
    );
  }

  private matchesCategoryFilter(transaction: Transaction): boolean {
    const categoryFilterValue = this.selectedCategoryId();
    if (!categoryFilterValue) {
      return true;
    }

    const transactionCategoryId = this.resolveTransactionCategoryId(transaction);
    if (categoryFilterValue === 'uncategorized') {
      return transactionCategoryId === null;
    }

    return transactionCategoryId === categoryFilterValue;
  }

  private matchesAmountRangeFilter(transaction: Transaction): boolean {
    const transactionAmount = Number(transaction.amount) || 0;
    const minimumAmountFilter = this.amountMin();
    const maximumAmountFilter = this.amountMax();

    if (minimumAmountFilter !== null && transactionAmount < minimumAmountFilter) {
      return false;
    }

    if (maximumAmountFilter !== null && transactionAmount > maximumAmountFilter) {
      return false;
    }

    return true;
  }

  private matchesDateRangeFilter(transaction: Transaction): boolean {
    const transactionDate = this.parseTransactionDate(transaction.date);
    if (!transactionDate) {
      return false;
    }

    const transactionDateKey = this.toDateKey(transactionDate);
    const dateFromFilter = this.dateFrom();
    const dateToFilter = this.dateTo();

    if (dateFromFilter && transactionDateKey < dateFromFilter) {
      return false;
    }

    if (dateToFilter && transactionDateKey > dateToFilter) {
      return false;
    }

    return true;
  }

  private sortTransactions(
    transactions: Transaction[],
    field: TransactionSortField,
    direction: TransactionSortDirection,
  ): Transaction[] {
    const directionFactor = direction === 'ASC' ? 1 : -1;
    const sortedTransactions = [...transactions];
    sortedTransactions.sort((left, right) => {
      let comparison = 0;
      if (field === 'date') {
        comparison = this.compareByTransactionDate(left, right);
      } else {
        comparison = this.compareByTransactionAmount(left, right);
      }

      if (comparison !== 0) {
        return comparison * directionFactor;
      }

      return this.compareByTransactionId(left, right) * directionFactor;
    });

    return sortedTransactions;
  }

  private compareByTransactionDate(left: Transaction, right: Transaction): number {
    const leftTimestamp = this.parseTransactionDate(left.date)?.getTime() ?? 0;
    const rightTimestamp = this.parseTransactionDate(right.date)?.getTime() ?? 0;
    return leftTimestamp - rightTimestamp;
  }

  private compareByTransactionAmount(left: Transaction, right: Transaction): number {
    const leftAmount = Number(left.amount) || 0;
    const rightAmount = Number(right.amount) || 0;
    return leftAmount - rightAmount;
  }

  private compareByTransactionId(left: Transaction, right: Transaction): number {
    const leftId = Number(left.id);
    const rightId = Number(right.id);

    if (Number.isFinite(leftId) && Number.isFinite(rightId)) {
      return leftId - rightId;
    }

    return String(left.id).localeCompare(String(right.id));
  }

  private paginateTransactions(
    transactions: Transaction[],
    page: number,
    pageSize: number,
  ): Transaction[] {
    const offset = (page - 1) * pageSize;
    return transactions.slice(offset, offset + pageSize);
  }

  private buildActiveFilterChips(): ActiveFilterChip[] {
    const chips: ActiveFilterChip[] = [];
    const categoryFilterValue = this.selectedCategoryId();
    if (categoryFilterValue) {
      const categoryName = this.resolveCategoryLabel(categoryFilterValue);
      chips.push({ key: 'category', label: `Categoria: ${categoryName}` });
    }

    if (this.amountMin() !== null) {
      chips.push({
        key: 'amountMin',
        label: `Monto >= ${this.formatAmountValue(this.amountMin() ?? 0)}`,
      });
    }

    if (this.amountMax() !== null) {
      chips.push({
        key: 'amountMax',
        label: `Monto <= ${this.formatAmountValue(this.amountMax() ?? 0)}`,
      });
    }

    if (this.dateFrom()) {
      chips.push({
        key: 'dateFrom',
        label: `Desde: ${this.formatDateValue(this.dateFrom())}`,
      });
    }

    if (this.dateTo()) {
      chips.push({
        key: 'dateTo',
        label: `Hasta: ${this.formatDateValue(this.dateTo())}`,
      });
    }

    return chips;
  }

  private resolveCategoryLabel(categoryId: string): string {
    if (categoryId === 'uncategorized') {
      return 'Sin categoria';
    }

    const category = this.categoryOptions().find((item) => item.id === categoryId);
    return category?.name ?? categoryId;
  }

  private resolveTransactionCategoryId(transaction: Transaction): string | null {
    const categoryId = transaction.category?.id;
    if (categoryId === null || categoryId === undefined) {
      return null;
    }

    const normalizedCategoryId = String(categoryId).trim();
    return normalizedCategoryId || null;
  }

  private formatAmountValue(value: number): string {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatDateValue(rawDate: Date | string): string {
    const parsedDate = this.parseTransactionDate(rawDate);
    if (!parsedDate) {
      return String(rawDate);
    }

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private normalizeDateFilterValue(rawValue: string): string {
    const value = rawValue.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
  }

  private parseOptionalNumber(rawValue: string): number | null {
    const value = rawValue.replace(',', '.').trim();
    if (!value) {
      return null;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return null;
    }

    return parsedValue;
  }

  private parseTransactionDate(rawValue: Date | string | undefined): Date | null {
    if (!rawValue) {
      return null;
    }

    if (rawValue instanceof Date) {
      if (Number.isNaN(rawValue.getTime())) {
        return null;
      }
      return rawValue;
    }

    const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const normalizedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
      );
      if (Number.isNaN(normalizedDate.getTime())) {
        return null;
      }
      return normalizedDate;
    }

    const parsedDate = new Date(rawValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getMaxPage(totalItems: number, pageSize: number): number {
    if (totalItems <= 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }
}
