import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

function withBearerToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function handleRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshDone$.next(null);

    return authService.refreshAccessToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        refreshDone$.next(response.token);
        return next(withBearerToken(req, response.token));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      }),
    );
  }

  // Another refresh is in flight — wait for it to complete then retry.
  return refreshDone$.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => next(withBearerToken(req, token))),
  );
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Don't attempt refresh for the refresh-token endpoint itself.
        if (req.url.includes('/api/auth/refresh-token')) {
          authService.logout();
          return throwError(() => error);
        }
        return handleRefresh(req, next, authService);
      }
      snackBar.open(`Error occured , error code : ${error.status}, error message : ${error.message}`, 'close', { duration: 2000 });
      return throwError(() => error);
    }),
  );
};
