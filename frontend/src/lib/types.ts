export type UserRole =
  | 'ADMINISTRATOR'
  | 'OPERATIONS_MANAGER'
  | 'SITE_SUPERVISOR'
  | 'OPERATOR'
  | 'ACCOUNTANT'
  | 'VIEWER';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  role_display: string;
  phone: string;
  employee_code?: string;
  is_active: boolean;
  can_approve_logsheets: boolean;
  can_edit_billing: boolean;
}

export interface CompanySettings {
  id: number;
  company_name: string;
  tagline: string;
  registration_no: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  website: string;
  registered_address: string;
  regional_depot: string;
  logsheet_prefix: string;
}

export type MachineStatus = 'AVAILABLE' | 'RENTED' | 'UNDER_MAINTENANCE' | 'BREAKDOWN' | 'STANDBY' | 'DECOMMISSIONED';

export interface MachineCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Machine {
  id: string;
  asset_code: string;
  name: string;
  category: string;
  category_name?: string;
  make_model: string;
  registration_number?: string;
  serial_number?: string;
  ownership_type: 'OWNED' | 'LEASED' | 'SUBCONTRACTED';
  ownership_display?: string;
  status: MachineStatus;
  status_display?: string;
  current_hour_meter: string;
  billing_type: 'HOURLY' | 'SHIFT' | 'DAILY' | 'MONTHLY';
  billing_type_display?: string;
  rental_rate: string;
  current_customer?: string;
  customer_name?: string;
  current_site?: string;
  site_name?: string;
  current_operator?: string;
  operator_name?: string;
  insurance_expiry?: string;
  fitness_expiry?: string;
  remarks?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone: string;
  gstin?: string;
  pan?: string;
  billing_address?: string;
  city?: string;
  state?: string;
  credit_period_days: number;
  deployed_machine_count?: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  customer: string;
  customer_name?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
}

export interface Site {
  id: string;
  name: string;
  project: string;
  project_name?: string;
  customer_id?: string;
  customer_name?: string;
  location: string;
  site_incharge?: string;
  site_contact?: string;
  supervisor?: string;
  supervisor_name?: string;
}

export interface Operator {
  id: string;
  employee_id: string;
  name: string;
  phone: string;
  license_number?: string;
  license_type: string;
  license_expiry?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  status_display?: string;
  experience_years: number;
}

export type LogsheetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'VOIDED';
export type WorkShift = 'DAY' | 'NIGHT' | 'GENERAL';

export interface LogsheetAuditEntry {
  id: string;
  action: string;
  performed_by_name: string;
  timestamp: string;
  notes?: string;
  snapshot?: Record<string, any>;
}

export interface LogsheetListItem {
  id: string;
  logsheet_number: string;
  date: string;
  shift: WorkShift;
  shift_display: string;
  machine: string;
  machine_code: string;
  machine_name: string;
  customer: string;
  customer_name: string;
  site: string;
  site_name: string;
  operator: string;
  operator_name: string;
  opening_meter: string;
  closing_meter: string;
  working_hours: string;
  idle_hours: string;
  breakdown_hours: string;
  overtime_hours: string;
  diesel_consumed_litres: string;
  status: LogsheetStatus;
  status_display: string;
  billed: boolean;
  created_at: string;
}

export interface LogsheetDetail extends LogsheetListItem {
  machine_make_model: string;
  machine_reg?: string;
  project: string;
  project_name: string;
  site_location: string;
  operator_phone?: string;
  supervisor?: string;
  rental_contract?: string;
  start_time?: string;
  end_time?: string;
  work_description: string;
  opening_fuel_litres?: string;
  diesel_received_litres: string;
  closing_fuel_litres?: string;
  fuel_remarks?: string;
  equipment_condition: 'EXCELLENT' | 'NORMAL' | 'ATTENTION_NEEDED' | 'BREAKDOWN';
  condition_display: string;
  breakdown_details?: string;
  remarks?: string;
  customer_rep_name?: string;
  customer_signature_confirmed: boolean;
  prepared_by_name?: string;
  submitted_at?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  invoice_number?: string;
  audit_trail: LogsheetAuditEntry[];
}

export interface DashboardMetrics {
  fleet: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    utilization_rate: number;
  };
  logsheets: {
    pending_approval: number;
    draft: number;
    approved: number;
    rejected: number;
    total: number;
  };
  operations: {
    total_working_hours: number;
    total_idle_hours: number;
    total_breakdown_hours: number;
    diesel_consumed_litres: number;
  };
  fuel: {
    total_issued_litres: number;
    total_cost: number;
  };
  finance: {
    pending_invoices_count: number;
    outstanding_amount: number;
  };
  machine_utilization: Array<{
    machine: string;
    hours: number;
  }>;
  recent_activity: Array<{
    id: string;
    action: string;
    entity: string;
    entity_id: string;
    actor: string;
    timestamp: string;
  }>;
}

