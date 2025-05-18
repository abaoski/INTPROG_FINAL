import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AccountService, AlertService } from '@app/_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(
        private accountService: AccountService,
        private router: Router,
        private alertService: AlertService
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            catchError(err => {
                if (err instanceof HttpErrorResponse) {
                    // Handle authentication errors
                    if ([401, 403].includes(err.status)) {
                        if (this.accountService.accountValue && !request.url.includes('/refresh-token')) {
                            console.log('Authentication error: ', err.status, request.url);
                            this.handleAuthError(err);
                        }
                    }
                    
                    // Create a user-friendly error message
                    let errorMessage = this.createUserFriendlyErrorMessage(err);
                    console.error('Error interceptor caught:', err);
                    return throwError(() => errorMessage);
                }
                
                // For non-HttpErrorResponse, just return the error
                return throwError(() => err);
            })
        );
    }
    
    private handleAuthError(err: HttpErrorResponse): void {
        // For auth errors, try to refresh the token once
        if (err.status === 401) {
            this.accountService.refreshToken().subscribe({
                error: (refreshError) => {
                    console.error('Token refresh failed:', refreshError);
                    // If refresh fails, log out
                    this.accountService.clearAccountData();
                    this.alertService.error('Your session has expired. Please log in again.');
                    this.router.navigate(['/account/login']);
                }
            });
        } else if (err.status === 403) {
            // Forbidden - user doesn't have necessary permissions
            this.alertService.error('You do not have permission to access this resource');
        }
    }
    
    private createUserFriendlyErrorMessage(err: HttpErrorResponse): string {
        // Start with the error message from the server if available
        let errorMsg = (err && err.error && err.error.message) || err.statusText;
        
        // Replace generic error messages with more user-friendly ones
        if (err.status === 401) {
            if (err.url?.includes('authenticate')) {
                errorMsg = 'Invalid email or password';
            } else {
                errorMsg = 'You need to log in to access this resource';
            }
        } else if (err.status === 403) {
            errorMsg = 'You do not have permission to perform this action';
        } else if (err.status === 404) {
            errorMsg = 'The requested resource was not found';
        } else if (err.status === 0) {
            errorMsg = 'Cannot connect to the server. Please check your internet connection';
        } else if (err.status >= 500) {
            errorMsg = 'A server error occurred. Please try again later';
        }
        
        return errorMsg;
    }
}