
export type ServiceType = 'Regular' | 'Deep Clean' | 'Move In/Out' | 'Commercial' | 'Window Cleaning';
export type RecurrenceType = 'One-time' | 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Multiple Manual';
export type JobStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
export type EmployeeRole = 'Cleaner' | 'Supervisor' | 'Specialist';
export type CustomerType = 'Individual' | 'Company';
export type LogType = 'work' | 'travel' | 'break';
export type LogStatus = 'pending' | 'approved' | 'rejected';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled' | 'Refunded' | 'Partially Refunded';
export type InvoiceType = 'Invoice' | 'CreditNote';

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface Client {
  id: string;
  shortName: string;
  customerType: CustomerType;
  name: string;
  street: string;
  zipCity: string;
  addressSuffix?: string;
  status: string;
  customerSince?: string;
  customerUntil?: string;
  csr?: string;
  tags: string[];
  referenceNumber?: string;
  debtorNumber?: string;
  homepage?: string;
  email: string;
  phone: string;
  mobile?: string;
  fax?: string;
  vatId?: string;
  briefInfo?: string;
  invoicingInstructions?: string;
  incidentSiteNotes?: string;
  warning?: string;
  logo?: string;
  createdAt: string;
  preferredEmployeeIds: string[];
  rejectedEmployeeIds: string[];
  isArchived?: boolean;
  preferredCleanupDays: string[];
  cleanupArea: string;
  recommendedStartTime: string;
  recommendedHours: number;
  staffNeeded: number;
  serviceRate: number;
  billingCycle: 'Immediate' | 'Weekly' | 'Monthly' | 'Manual';
  nextBillingDate?: string;
}

export interface Invoice {
  id: string;
  type?: InvoiceType;
  parentInvoiceId?: string;
  jobId?: string;
  clientId: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  refundAmount?: number;
  notes?: string;
  serviceDescription?: string;
}

export interface Absence {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  reason: 'Vacation' | 'Sick' | 'Personal';
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface EmployeeDocument {
  id: string;
  type: 'ID' | 'Work Permit' | 'Contract' | 'Insurance' | 'Driver License';
  expiryDate?: string;
  status: 'Valid' | 'Expiring' | 'Expired';
}

export interface Availability {
  weekly: string[];
  blackoutDates: string[];
  dailyStart: string;
  dailyEnd: string;
}

export interface Employee {
  id: string;
  salutation: string;
  lastName: string;
  firstName: string;
  dob?: string;
  maritalStatus: string;
  email: string;
  privateEmail?: string;
  phone?: string;
  mobile: string;
  street: string;
  postalCode: string;
  city: string;
  addressSuffix?: string;
  photo?: string;
  warning?: string;
  tags: string[];
  personnelNumber: string;
  weeklyHours: number;
  vacationDays: number;
  payGrade?: string;
  nationality?: string;
  residencePermitUntil?: string;
  residencePermitInfo?: string;
  startDate: string;
  endDate?: string;
  taxId?: string;
  socialSecurityNumber?: string;
  healthInsurance?: string;
  lbnr?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  drivingLicense?: 'Yes' | 'No' | 'In Progress';
  clothingSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  languages?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  assignmentGroups: string[];
  schedulingNotes?: string;
  assignmentRadius: number;
  role: EmployeeRole;
  hourlyRate: number;
  specialistRate?: number;
  hoursWorkedThisWeek: number;
  location: string;
  isActive: boolean;
  skills: string[];
  appLanguage?: string;
  previewPeriod: string;
  permissions: {
    showAllLocations: boolean;
    setupTimeTracking: boolean;
    timeEditing: boolean;
    allowCreatingAssignments: boolean;
    mileageTravel: boolean;
    mileageAssignments: boolean;
    qrCode: boolean;
    autoRecord: boolean;
  };
  isArchived?: boolean;
  preferredWorkingDays: string[];
  preferredWorkingHoursStart: string;
  preferredWorkingHoursEnd: string;
  performanceRating: number;
  reliabilityScore: number;
  onboardingProgress: number;
  documents: EmployeeDocument[];
  assignedAssets: string[];
  availability: Availability;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  baseHours: number;
  overtimeHours: number;
  basePay: number;
  overtimePay: number;
  bonus: number;
  adjustmentAmount: number;
  adjustmentNote?: string;
  grossPay: number;
  taxAmount: number;
  netPay: number;
  status: 'Draft' | 'Approved' | 'Disbursed';
  processedDate?: string;
}

export interface Job {
  id: string;
  clientId: string;
  serviceType: ServiceType;
  recurrence: RecurrenceType;
  scheduledDate: string;
  startTime: string;
  estimatedHours: number;
  staffNeeded: number;
  status: JobStatus;
  invoiceStatus?: 'Uninvoiced' | 'Invoiced' | 'Paid';
  assignedEmployeeIds: string[];
  assignedRoles: Record<string, string>;
  address: string;
  totalPrice: number;
  checklist: ChecklistItem[];
  photos: { before: string[]; after: string[] };
  groupId?: string;
  isArchived?: boolean;
  ppeCheckComplete?: boolean;
}

export interface TimeLog {
  id: string;
  employeeId: string;
  jobId: string;
  type: LogType;
  start: string;
  end?: string;
  status: LogStatus;
  notes?: string;
}
