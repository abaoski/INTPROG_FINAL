import { Employee } from './employee';

export interface Workflow {
    id?: string;
    employeeId: number;
    type: WorkflowType;
    details: WorkflowDetails;
    status: WorkflowStatus;
    employee?: Employee;
    createdDate?: Date;
    lastModifiedDate?: Date;
}

export enum WorkflowType {
    LeaveRequest = 'Leave Request',
    EquipmentRequest = 'Equipment Request',
    DepartmentChange = 'Department Change',
    Other = 'Other'
}

export enum WorkflowStatus {
    Approved = 'Approved',
    Rejected = 'Rejected',
    Completed = 'Completed'
}

export interface WorkflowDetails {
    task: string;
    additionalInfo?: string;
}

export class WorkflowItem {
    id: string;
    name: string;
    quantity: number;
} 