import { Routes } from '@angular/router';
import { authCanActivateChildGuard, authCanActivateGuard, authCanMatchGuard } from './core/auth/auth.guard';
import { AppShellComponent } from './core/layout/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/containers/login.page').then((m) => m.LoginPageComponent)
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authCanActivateGuard],
    canActivateChild: [authCanActivateChildGuard],
    canMatch: [authCanMatchGuard],
    children: [
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
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
