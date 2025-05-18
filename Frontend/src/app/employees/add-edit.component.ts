import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService, EmployeeService, DepartmentService } from '@app/_services';
import { Employee, Account, Department, Role } from '@app/_models';

// Update Employee interface to allow string for hireDate
interface EmployeeForm extends Omit<Employee, 'hireDate'> {
    hireDate: string;
}

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;
    accounts: Account[] = [];
    availableAccounts: Account[] = [];
    departments: Department[] = [];
    selectedAccountName: string = '';
    existingEmployeeIds: string[] = [];
    showDeleteModal = false;
    showDepartmentModal = false;
    employeeToDelete: string = null;
    newDepartmentId: string = '';
    currentEmployee: EmployeeForm = null;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private employeeService: EmployeeService,
        private departmentService: DepartmentService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;

        // Load all departments
        this.departmentService.getAll()
            .pipe(first())
            .subscribe(departments => {
                this.departments = departments;
            });

        // Initialize form with appropriate disabled states
        this.form = this.formBuilder.group({
            accountId: [{ value: '', disabled: !this.isAddMode }, this.isAddMode ? Validators.required : []],
            employeeId: ['', Validators.required], // User will enter manually
            departmentId: ['', Validators.required],
            position: ['', Validators.required],
            hireDate: ['', Validators.required],
            status: ['Active']
        });

        // Load existing employee IDs for validation
        this.employeeService.getAll()
            .pipe(first())
            .subscribe(employees => {
                this.existingEmployeeIds = employees.map(e => e.employeeId);
            });

        // Load all accounts and filter available ones
        this.accountService.getAll()
            .pipe(first())
            .subscribe({
                next: (accounts) => {
                    this.accounts = accounts;
                    
                    if (!this.isAddMode) {
                        // In edit mode, first load the current employee
                        this.employeeService.getById(this.id)
                            .pipe(first())
                            .subscribe({
                                next: (employee) => {
                                    this.currentEmployee = {
                                        ...employee,
                                        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : ''
                                    };
                                    this.form.patchValue(this.currentEmployee);
                                    if (employee.account) {
                                        this.selectedAccountName = `${employee.account.firstName} ${employee.account.lastName}`;
                                    }
                                    // Update available accounts after loading current employee
                                    this.updateAvailableAccounts();
                                },
                                error: error => {
                                    this.alertService.error(error);
                                }
                            });
                    } else {
                        // In add mode, just update available accounts
                        this.updateAvailableAccounts();
                    }
                },
                error: error => {
                    this.alertService.error('Error loading accounts: ' + error);
                }
            });

        // Watch for account changes to update the name display
        this.form.get('accountId').valueChanges.subscribe(accountId => {
            const account = this.accounts.find(a => a.id === accountId);
            if (account) {
                this.selectedAccountName = `${account.firstName} ${account.lastName}`;
            } else {
                this.selectedAccountName = '';
            }
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;
        this.alertService.clear();

        if (this.form.invalid) {
            return;
        }

        // Check if employee ID already exists in add mode
        if (this.isAddMode && this.existingEmployeeIds.includes(this.form.get('employeeId').value)) {
            this.alertService.error('Employee ID already exists');
            return;
        }

        this.loading = true;
        if (this.isAddMode) {
            this.createEmployee();
        } else {
            this.updateEmployee();
        }
    }

    private createEmployee() {
        const formData = {
            ...this.form.getRawValue() // Get values from disabled fields too
        };
        
        this.employeeService.create(formData)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Employee added successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['/employees']);
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    private updateEmployee() {
        const formData = {
            ...this.form.getRawValue() // Get values from disabled fields too
        };
        
        this.employeeService.update(this.id, formData)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Employee updated successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['/employees']);
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    // Delete modal methods
    openDeleteModal(id: string) {
        this.employeeToDelete = id;
        this.showDeleteModal = true;
    }

    cancelDelete() {
        this.showDeleteModal = false;
        this.employeeToDelete = null;
    }

    confirmDelete() {
        if (!this.employeeToDelete) return;
        
        this.loading = true;
        this.employeeService.delete(this.employeeToDelete)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Employee deleted successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['/employees']);
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    // Change Department modal methods
    openChangeDepartment() {
        this.submitted = false;
        this.newDepartmentId = '';
        this.showDepartmentModal = true;
    }

    cancelChangeDepartment() {
        this.showDepartmentModal = false;
        this.newDepartmentId = '';
        this.submitted = false;
    }

    confirmChangeDepartment() {
        this.submitted = true;

        if (!this.newDepartmentId) {
            return;
        }

        this.loading = true;

        // Convert the current employee to the correct type
        const updateData = {
            ...this.currentEmployee,
            departmentId: this.newDepartmentId,
            hireDate: this.currentEmployee.hireDate ? new Date(this.currentEmployee.hireDate) : null
        };

        this.employeeService.update(this.id, updateData)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Department changed successfully', { keepAfterRouteChange: true });
                    this.loading = false;
                    this.showDepartmentModal = false;
                    // Refresh the current employee data
                    this.employeeService.getById(this.id)
                        .pipe(first())
                        .subscribe(employee => {
                            // Convert the employee to EmployeeForm type
                            this.currentEmployee = {
                                ...employee,
                                hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : ''
                            };
                            this.form.patchValue(this.currentEmployee);
                        });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    // Computed property to get available departments (excluding current department)
    get availableDepartments(): Department[] {
        if (!this.currentEmployee || !this.currentEmployee.departmentId) {
            return this.departments;
        }
        
        // Convert all IDs to strings for comparison
        const currentDeptIdStr = String(this.currentEmployee.departmentId);
        return this.departments.filter(dept => String(dept.id) !== currentDeptIdStr);
    }
    
    private updateAvailableAccounts() {
        this.employeeService.getAll()
            .pipe(first())
            .subscribe({
                next: (employees) => {
                    const usedAccountIds = employees.map(e => e.accountId.toString());
                    
                    // Filter accounts:
                    // 1. Remove admin accounts
                    // 2. Remove accounts that are already assigned to employees (except in edit mode for current account)
                    this.availableAccounts = this.accounts.filter(account => {
                        const isAdmin = account.role === Role.Admin;
                        const isAlreadyAssigned = usedAccountIds.includes(account.id);
                        const isCurrentAccount = !this.isAddMode && account.id === this.form?.get('accountId')?.value;
                        
                        return !isAdmin && (!isAlreadyAssigned || isCurrentAccount);
                    });

                    // Sort accounts by name for better UX
                    this.availableAccounts.sort((a, b) => 
                        `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
                    );
                },
                error: (error) => {
                    this.alertService.error('Error loading employees: ' + error);
                }
            });
    }
}