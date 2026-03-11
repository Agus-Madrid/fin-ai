import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  CanMatchFn,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree
} from '@angular/router';
import { AuthService } from './auth.service';

function buildAuthResult(targetUrl: string): boolean | UrlTree {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.canAccessProtectedRoute()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: targetUrl || '/dashboard' }
  });
}

function buildLoginPageResult(): boolean | UrlTree {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.canAccessProtectedRoute()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
}

export const authCanActivateGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => buildAuthResult(state.url);

export const authCanActivateChildGuard: CanActivateChildFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => buildAuthResult(state.url);

export const authCanMatchGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const routePath = route.path ?? '';
  const segmentsPath = segments.map((segment) => segment.path).join('/');
  const combined = [routePath, segmentsPath].filter(Boolean).join('/');
  return buildAuthResult(`/${combined}`);
};

export const loginCanActivateGuard: CanActivateFn = () => buildLoginPageResult();
