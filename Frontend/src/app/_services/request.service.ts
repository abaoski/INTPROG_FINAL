import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { Request } from '../_models';
import { EmployeeService } from './employee.service';

const baseUrl = `${environment.apiUrl}/requests`;

@Injectable({ providedIn: 'root' })
export class RequestService {
    constructor(
        private http: HttpClient,
        private employeeService: EmployeeService
    ) { }

    // Create a new request
    create(params: any) {
        return this.http.post(baseUrl, params);
    }

    // Get all requests (Admin only)
    getAll() {
        return this.http.get(baseUrl);
    }

    // Get request by ID
    getById(id: string): Observable<Request> {
        return this.http.get<Request>(`${baseUrl}/${id}`);
    }

    // Get requests for an employee
    getByEmployeeId(employeeId: string) {
        return this.http.get(`${baseUrl}/employee/${employeeId}`);
    }

    // Get requests for the current logged-in user's employee record
    getMyRequests() {
        return this.employeeService.getCurrentEmployeeId().pipe(
            switchMap(employeeId => {
                if (!employeeId) {
                    console.error('No employee ID found for current user');
                    return of([]);
                }
                return this.getByEmployeeId(employeeId);
            }),
            catchError(error => {
                console.error('Error fetching my requests:', error);
                return of([]);
            })
        );
    }

    // Get assigned requests
    getAssignedRequests() {
        return this.http.get(`${baseUrl}/assigned`);
    }

    // Update request
    update(id: string, params: any) {
        return this.http.put(`${baseUrl}/${id}`, params);
    }

    // Delete request (Admin only)
    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }

    // Update request status
    changeStatus(id: string, status: string, notes: string = '') {
        return this.http.put(`${baseUrl}/${id}/status`, { status, notes });
    }
} 