import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/containers/dashboard.page').then((m) => m.DashboardPageComponent)
  },
  {
    path: 'review-inbox',
    loadComponent: () =>
      import('./features/review-inbox/containers/review-inbox.page').then((m) => m.ReviewInboxPageComponent)
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/containers/transactions.page').then((m) => m.TransactionsPageComponent)
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./features/categories/containers/categories.page').then((m) => m.CategoriesPageComponent)
  },
  {
    path: 'uploads',
    loadComponent: () =>
      import('./features/uploads/containers/uploads.page').then((m) => m.UploadsPageComponent)
  },
  {
    path: 'budget-planner',
    loadComponent: () =>
      import('./features/budget-planner/containers/budget-planner.page').then((m) => m.BudgetPlannerPageComponent)
  }
];
