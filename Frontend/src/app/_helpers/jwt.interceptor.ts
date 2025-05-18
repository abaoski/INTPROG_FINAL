import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, filter, take, switchMap, finalize, tap } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { AccountService } from '@app/_services';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    private isRefreshing = false;
    private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    private tokenRefreshAttempts = 0;
    private readonly MAX_REFRESH_ATTEMPTS = 3;

    constructor(private accountService: AccountService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Add auth header with JWT if account is logged in and request is to the API url
        const account = this.accountService.accountValue;
        const isLoggedIn = account?.jwtToken;
        const isApiUrl = request.url.startsWith(environment.apiUrl);
        
        if (isLoggedIn && isApiUrl && !this.isRefreshTokenRequest(request)) {
            request = this.addTokenHeader(request, account.jwtToken);
        }

        return next.handle(request).pipe(
            catchError(error => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    // Handle 401 errors (unauthorized)
                    if (!this.isRefreshing && !this.isRefreshTokenRequest(request) && this.tokenRefreshAttempts < this.MAX_REFRESH_ATTEMPTS) {
                        this.tokenRefreshAttempts++;
                        console.log(`Token refresh attempt ${this.tokenRefreshAttempts} of ${this.MAX_REFRESH_ATTEMPTS}`);
                        return this.handle401Error(request, next);
                    } else if (this.isRefreshTokenRequest(request)) {
                        // If refresh token fails, we should log out only in production
                        if (environment.production) {
                            this.accountService.clearAccountData();
                            return throwError(() => new Error('Your session has expired. Please log in again.'));
                        } else {
                            // In development with fake backend, just return the error
                            return throwError(() => error);
                        }
                    } else if (this.tokenRefreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
                        console.error('Max token refresh attempts reached. Stopping refresh cycle.');
                        this.tokenRefreshAttempts = 0;
                        
                        // Only log out in production
                        if (environment.production) {
                            this.accountService.clearAccountData();
                            return throwError(() => new Error('Maximum refresh attempts exceeded. Please log in again.'));
                        } else {
                            // In development, allow request to proceed with error for debugging
                            return throwError(() => error);
                        }
                    }
                } else if (error instanceof HttpErrorResponse && error.status === 403) {
                    // Don't automatically logout on 403 (forbidden)
                    return throwError(() => new Error('Access forbidden. You do not have permission to access this resource.'));
                }
                return throwError(() => error);
            })
        );
    }

    private isRefreshTokenRequest(request: HttpRequest<any>): boolean {
        return request.url.includes('/refresh-token') || request.url.includes('/revoke-token');
    }

    private addTokenHeader(request: HttpRequest<any>, token: string) {
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
    }

    private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
        if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return this.accountService.refreshToken().pipe(
                tap(account => {
                    console.log('Token refreshed successfully');
                    this.tokenRefreshAttempts = 0; // Reset attempts counter on successful refresh
                }),
                switchMap((account: any) => {
                    this.isRefreshing = false;
                    this.refreshTokenSubject.next(account.jwtToken);
                    return next.handle(this.addTokenHeader(request, account.jwtToken));
                }),
                catchError(error => {
                    this.isRefreshing = false;
                    console.error('Token refresh failed:', error);
                    
                    // Don't automatically logout in development with fake backend
                    if (environment.production) {
                        this.accountService.clearAccountData();
                    }
                    
                    return throwError(() => error);
                }),
                finalize(() => {
                    this.isRefreshing = false;
                })
            );
        }

        return this.refreshTokenSubject.pipe(
            filter(token => token !== null),
            take(1),
            switchMap(token => next.handle(this.addTokenHeader(request, token)))
        );
    }
}