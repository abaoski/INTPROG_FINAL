import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

import { WorkflowService, AlertService, AccountService, EmployeeService } from '@app/_services';
import { Role, WorkflowStatus } from '@app/_models';
import { ConfirmModalComponent } from './confirm-modal.component';

@Component({ templateUrl: 'list.component.html' })
export class ListWorkflowComponent implements OnInit {
    @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
    workflows = null;
    loading = false;
    isAdmin = false;
    employeeId: string | null = null;
    displayEmployeeId: string | null = null;
    employeeFullName: string | null = null;
    confirmMessage: string = '';
    notFound = false;
    private pendingStatusChange: { id: string; status: WorkflowStatus } | null = null;
    
    // Make enum available in template
    WorkflowStatus = WorkflowStatus;

    constructor(
        private workflowService: WorkflowService,
        private alertService: AlertService,
        private accountService: AccountService,
        private employeeService: EmployeeService,
        private route: ActivatedRoute
    ) {
        this.isAdmin = this.accountService.accountValue?.role === Role.Admin;
        
        // Get employeeId from query params
        this.route.queryParams.subscribe(params => {
            this.employeeId = params['employeeid'];
            if (this.employeeId) {
                this.loadEmployee();
                this.loadWorkflows();
            } else {
                this.notFound = false;
                this.loadWorkflows();
            }
        });
    }

    ngOnInit() {
        // If not admin and no employeeId specified, find the current user's employee ID
        if (!this.isAdmin && !this.employeeId) {
            this.findCurrentUserEmployeeId();
        } else {
            this.loadWorkflows();
        }
    }

    private findCurrentUserEmployeeId() {
        this.loading = true;
        const currentAccountId = this.accountService.accountValue?.id;
        
        this.employeeService.getAll()
            .pipe(first())
            .subscribe({
                next: (employees) => {
                    const currentEmployee = employees.find(emp => emp.accountId === Number(currentAccountId));
                    if (currentEmployee) {
                        this.employeeId = currentEmployee.id.toString();
                        this.loadEmployee();
        this.loadWorkflows();
                    } else {
                        this.loading = false;
                        this.alertService.error('Could not find your employee record');
                    }
                },
                error: error => {
                    this.loading = false;
                    this.alertService.error(error);
                }
            });
    }

    private loadEmployee() {
        if (!this.employeeId) return;
        
        this.employeeService.getById(this.employeeId)
            .pipe(first())
            .subscribe({
                next: (employee) => {
                    if (employee && employee.account) {
                        this.displayEmployeeId = employee.employeeId;
                        const firstName = employee.account.firstName.charAt(0).toUpperCase() + employee.account.firstName.slice(1).toLowerCase();
                        const lastName = employee.account.lastName.charAt(0).toUpperCase() + employee.account.lastName.slice(1).toLowerCase();
                        this.employeeFullName = `${firstName} ${lastName}`;
                    }
                },
                error: error => {
                    this.alertService.error(error);
                }
            });
    }

    private loadWorkflows() {
        this.loading = true;
        let request;

        if (this.employeeId) {
            // For both admin and regular users, filter by employeeId if it's specified
            request = this.workflowService.getByEmployeeId(this.employeeId);
        } else if (this.isAdmin) {
            // Only admins can see all workflows
            request = this.workflowService.getAll();
        } else {
            // This shouldn't normally happen for regular users (they should have employeeId set by findCurrentUserEmployeeId)
            // But as a fallback, show no workflows
            this.workflows = [];
            this.loading = false;
            this.notFound = true;
            return;
        }

        request.pipe(first())
            .subscribe({
                next: (workflows: any) => {
                    // Sort workflows by date in descending order
                    this.workflows = workflows.sort((a: any, b: any) => {
                        const dateA = new Date(a.datetimecreated).getTime();
                        const dateB = new Date(b.datetimecreated).getTime();
                        return dateB - dateA;
                    });
                    this.loading = false;
                    this.notFound = false;
                },
                error: error => {
                    if (error.status === 404) {
                        this.notFound = true;
                    }
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    openStatusChangeModal(id: string, status: WorkflowStatus) {
        const workflow = this.workflows.find(x => x.id === id);
        if (!workflow) return;

        this.pendingStatusChange = { id, status };
        
        let statusMessage;
        if (status === WorkflowStatus.Approved) {
            statusMessage = 'approve';
        } else if (status === WorkflowStatus.Rejected) {
            statusMessage = 'reject';
        } else {
            statusMessage = 'mark for review';
        }
        
        this.confirmMessage = `Are you sure you want to ${statusMessage} this workflow?`;
        this.confirmModal.show();
    }

    onStatusChangeConfirmed() {
        if (!this.pendingStatusChange) return;

        const { id, status } = this.pendingStatusChange;
        const workflow = this.workflows.find(x => x.id === id);
        if (!workflow) return;

        workflow.isUpdating = true;
        this.workflowService.changeStatus(id, status)
            .pipe(first())
            .subscribe({
                next: () => {
                    workflow.status = status;
                    workflow.isUpdating = false;
                    this.alertService.success('Workflow status updated successfully');
                },
                error: error => {
                    this.alertService.error(error);
                    workflow.isUpdating = false;
                }
            });

        this.pendingStatusChange = null;
    }

    deleteWorkflow(id: string) {
        const workflow = this.workflows.find(x => x.id === id);
        if (!workflow) return;

        if (confirm('Are you sure you want to delete this workflow?')) {
            workflow.isDeleting = true;
            this.workflowService.delete(id)
                .pipe(first())
                .subscribe({
                    next: () => {
                        this.workflows = this.workflows.filter(x => x.id !== id);
                        this.alertService.success('Workflow deleted successfully');
                    },
                    error: error => {
                        this.alertService.error(error);
                        workflow.isDeleting = false;
                    }
                });
        }
    }
} 