import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first, finalize } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { environment } from '../../environments/environment';

@Component({ templateUrl: 'forgot-password.component.html' })
export class ForgotPasswordComponent implements OnInit {
    form: UntypedFormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: UntypedFormBuilder,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // Only clear 'success' and 'error' alerts, not 'info' alerts that may contain password reset links
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        this.accountService.forgotPassword(this.f.email.value)
            .pipe(
                first(),
                finalize(() => this.loading = false)
            )
            .subscribe({
                next: (response) => {
                    // The fake backend will never return a resetToken in the response for security,
                    // but we can extract it from localStorage in development for convenience
                    if (environment.useFakeBackend) {
                        // Get the reset token from localStorage for this user's email
                        const accountsKey = 'request-management-accounts';
                        const accounts = JSON.parse(localStorage.getItem(accountsKey)) || [];
                        const account = accounts.find(x => x.email === this.f.email.value);
                        
                        if (account && account.resetToken) {
                            // Create the reset URL directly
                            const resetUrl = `${window.location.origin}/account/reset-password?token=${account.resetToken.token}`;
                            
                            // Show a success message with the reset link embedded
                            this.alertService.success(`
                                <strong>Password Reset Instructions</strong>
                                <p>Since you're using the fake backend, here's your reset link:</p>
                                <p><a href="${resetUrl}" class="alert-link">${resetUrl}</a></p>
                                <p class="mb-0"><small>(In a real application, this would be sent via email)</small></p>
                            `, { autoClose: false, keepAfterRouteChange: true });
                            
                            // Also log it to console for backup
                            console.log('PASSWORD RESET URL:', resetUrl);
                        } else {
                            // Try to find ANY account with a reset token (for demo purposes)
                            const anyAccountWithToken = accounts.find(x => x.resetToken);
                            if (anyAccountWithToken) {
                                const resetUrl = `${window.location.origin}/account/reset-password?token=${anyAccountWithToken.resetToken.token}`;
                                this.alertService.success(`
                                    <strong>Demo Reset Link</strong>
                                    <p>Here's a demo reset link you can use:</p>
                                    <p><a href="${resetUrl}" class="alert-link">${resetUrl}</a></p>
                                `, { autoClose: false, keepAfterRouteChange: true });
                            } else {
                                // If no tokens at all, create a fake one
                                const demoToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                                const resetUrl = `${window.location.origin}/account/reset-password?token=${demoToken}`;
                                this.alertService.success(`
                                    <strong>Demo Reset Link</strong>
                                    <p>Here's a demonstration reset link (note: this specific link won't work as it's randomly generated):</p>
                                    <p><a href="${resetUrl}" class="alert-link">${resetUrl}</a></p>
                                `, { autoClose: false, keepAfterRouteChange: true });
                            }
                        }
                    } else {
                        this.alertService.success('Please check your email for password reset instructions');
                    }
                },
                error: error => {
                    this.alertService.error(error);
                }
            });
    }
}