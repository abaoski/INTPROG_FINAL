import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, finalize, switchMap, catchError } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { Employee } from '../_models';
import { AccountService } from './account.service';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
    private employeeSubject: BehaviorSubject<Employee | null>;
    public employee: Observable<Employee | null>;

    constructor(
        private router: Router,
        private http: HttpClient,
        private accountService: AccountService
    ) {
        this.employeeSubject = new BehaviorSubject<Employee | null>(null);
        this.employee = this.employeeSubject.asObservable();
    }

    public get employeeValue(): Employee | null {
        return this.employeeSubject.value;
    }

    getAll() {
        return this.http.get<Employee[]>(`${environment.apiUrl}/employees`)
            .pipe(map(employees => {
                return employees.map(employee => this.mapDepartmentName(employee));
            }));
    }

    getById(id: string) {
        return this.http.get<Employee>(`${environment.apiUrl}/employees/${id}`)
            .pipe(map(employee => this.mapDepartmentName(employee)));
    }

    getByAccountId(accountId: string) {
        return this.http.get<Employee>(`${environment.apiUrl}/employees/account/${accountId}`)
            .pipe(map(employee => this.mapDepartmentName(employee)));
    }

    create(employee: Employee) {
        return this.http.post<Employee>(`${environment.apiUrl}/employees`, employee)
            .pipe(map(employee => this.mapDepartmentName(employee)));
    }

    update(id: string, params: any) {
        return this.http.put<Employee>(`${environment.apiUrl}/employees/${id}`, params)
            .pipe(map(employee => {
                // Map department name
                employee = this.mapDepartmentName(employee);
                
                // update employee if it's the current employee
                if (employee.id === this.employeeValue?.id) {
                    // publish updated employee to subscribers
                    employee = { ...this.employeeValue, ...employee };
                    this.employeeSubject.next(employee);
                }
                return employee;
            }));
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/employees/${id}`)
            .pipe(finalize(() => {
                // auto logout if the logged in employee was deleted
                if (id === this.employeeValue?.id)
                    this.employeeSubject.next(null);
            }));
    }

    private mapDepartmentName(employee: Employee): Employee {
        if (employee && employee['Department']) {
            return {
                ...employee,
                departmentName: employee['Department'].name
            };
        }
        return employee;
    }

    getCurrentEmployeeId(): Observable<string | null> {
        return this.accountService.account.pipe(
            switchMap(account => {
                if (!account) {
                    return of(null);
                }
                return this.getByAccountId(account.id).pipe(
                    map(employee => employee.id.toString()),
                    catchError(() => of(null))
                );
            }),
            catchError(() => of(null))
        );
    }
} 