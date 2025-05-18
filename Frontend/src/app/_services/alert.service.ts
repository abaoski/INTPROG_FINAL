import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Alert, AlertType } from '../_models';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private subject = new Subject<Alert>();
    private defaultId = 'default-alert';

    // enable subscribing to alerts observable
    onAlert(id = this.defaultId): Observable<Alert> {
        return this.subject.asObservable().pipe(filter(x => x && x.id === id));
    }

    // convenience methods
    success(message: string, options?: any) {
        this.alert(new Alert({ ...options, type: AlertType.Success, message }));
    }

    error(message: string, options?: any) {
        this.alert(new Alert({ ...options, type: AlertType.Error, message }));
    }

    info(message: string, options?: any) {
        console.log('INFO ALERT CREATED:', message, options);
        this.alert(new Alert({ ...options, type: AlertType.Info, message }));
        
        // Only show native alert if explicitly requested via options
        if (options && options.showNativeAlert) {
            setTimeout(() => {
                console.log('Showing native alert as requested');
                alert('Password Reset Link Created! The link is also in the browser console.');
            }, 1500);
        }
    }

    warn(message: string, options?: any) {
        this.alert(new Alert({ ...options, type: AlertType.Warning, message }));
    }

    // core alert method
    alert(alert: Alert) {
        alert.id = alert.id || this.defaultId;
        alert.autoClose = (alert.autoClose === undefined ? true : alert.autoClose);
        console.log('ALERT EMITTED:', alert);
        this.subject.next(alert);
    }

    // clear alerts
    clear(id = this.defaultId) {
        this.subject.next(new Alert({ id }));
    }
} 