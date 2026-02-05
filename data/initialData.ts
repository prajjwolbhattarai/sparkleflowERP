
import { Client, Employee, Job, TimeLog, Absence, Invoice } from '../types';

export const INITIAL_CLIENTS: Client[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `c${i + 1}`,
  shortName: `Client ${i + 1}`,
  customerType: i % 2 === 0 ? 'Company' : 'Individual',
  name: i % 2 === 0 ? `Enterprise Solution ${i + 1} GmbH` : `John Doe ${i + 1}`,
  street: `Main St ${10 + i}`,
  zipCity: `1011${i} Berlin`,
  status: 'Active',
  email: `client${i + 1}@example.com`,
  phone: `+49 30 123456${i}`,
  tags: i % 3 === 0 ? ['VIP', 'Monthly'] : ['Standard'],
  createdAt: '2023-01-01',
  preferredEmployeeIds: [],
  rejectedEmployeeIds: [],
  incidentSiteNotes: i % 2 === 0 ? 'Gate code 1234' : 'Key under mat',
  warning: i % 4 === 0 ? 'Very aggressive cat' : undefined,
  invoicingInstructions: 'Send by mail',
  preferredCleanupDays: i % 2 === 0 ? ['Monday', 'Wednesday'] : ['Tuesday'],
  cleanupArea: '150sqm',
  recommendedStartTime: '08:00',
  recommendedHours: 3,
  staffNeeded: i % 3 === 0 ? 2 : 1,
  serviceRate: i % 2 === 0 ? 45 : 35, // Baseline rates
  // Added missing required property billingCycle
  billingCycle: i % 4 === 0 ? 'Monthly' : (i % 2 === 0 ? 'Weekly' : 'Immediate')
}));

export const INITIAL_EMPLOYEES: Employee[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `e${i + 1}`,
  salutation: i % 2 === 0 ? 'Mrs' : 'Mr',
  lastName: `Expert-${i + 1}`,
  firstName: `Cleaning-${i + 1}`,
  maritalStatus: 'Not married / Unknown',
  email: `staff${i + 1}@sparkleflow.com`,
  mobile: `+49 176 00000${i}`,
  street: `Service Road ${i * 5}`,
  postalCode: `1000${i}`,
  city: 'Berlin',
  tags: i % 3 === 0 ? ['Senior', 'Lead'] : ['Junior'],
  personnelNumber: (1000 + i).toString(),
  weeklyHours: 40,
  vacationDays: 28,
  startDate: '2022-01-01',
  role: i % 3 === 0 ? 'Supervisor' : 'Cleaner',
  hourlyRate: 18 + i,
  hoursWorkedThisWeek: Math.floor(Math.random() * 20),
  location: i % 2 === 0 ? 'Berlin Mitte' : 'Berlin Pankow',
  isActive: true,
  skills: i % 2 === 0 ? ['Deep Clean', 'Windows'] : ['Basic'],
  assignmentGroups: [],
  assignmentRadius: 20,
  previewPeriod: '4 weeks',
  
  taxId: `DE${123456780 + i}`,
  socialSecurityNumber: `481203${i}K002`,
  healthInsurance: 'Techniker Krankenkasse',
  iban: `DE89 3704 0044 0532 0130 ${i}0`,
  bankName: 'Sparkasse Berlin',
  bic: 'PBNKDEFFXXX',
  drivingLicense: i % 3 === 0 ? 'Yes' : 'No',
  clothingSize: i % 4 === 0 ? 'L' : 'M',
  emergencyContactName: 'Emergency Relation',
  emergencyContactPhone: '+49 152 0000000',

  preferredWorkingDays: i % 2 === 0 ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] : ['Saturday', 'Sunday', 'Monday'],
  preferredWorkingHoursStart: '08:00',
  preferredWorkingHoursEnd: '17:00',

  permissions: {
    showAllLocations: true,
    setupTimeTracking: true,
    timeEditing: false,
    allowCreatingAssignments: false,
    mileageTravel: true,
    mileageAssignments: true,
    qrCode: true,
    autoRecord: true
  },
  // Fix: Added missing HR fields to satisfy Employee type
  performanceRating: 4 + (i % 2),
  reliabilityScore: 85 + (i % 15),
  onboardingProgress: 100,
  documents: [],
  assignedAssets: i % 3 === 0 ? ['Keys-A1', 'Vacuum-X10'] : [],
  // Fix: Added missing availability property to satisfy Employee type
  availability: {
    weekly: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    blackoutDates: [],
    dailyStart: '08:00',
    dailyEnd: '17:00'
  }
}));

const getSpreadDate = (index: number) => {
  const d = new Date();
  d.setDate(d.getDate() - 10 + (index % 15));
  return d.toISOString().split('T')[0];
};

export const INITIAL_JOBS: Job[] = Array.from({ length: 20 }).map((_, i) => {
  const isAssigned = i % 2 === 0;
  const assignedEmployeeIds = isAssigned ? [`e${(i % 10) + 1}`] : [];
  
  if (isAssigned && i % 4 === 0) {
    assignedEmployeeIds.push(`e${((i + 1) % 10) + 1}`);
  }

  // Make some older jobs completed and invoiced
  const status = (i < 5) ? 'Completed' : (isAssigned ? 'Assigned' : 'Pending');
  const invoiceStatus = (i < 3) ? 'Paid' : (i === 3 || i === 4) ? 'Invoiced' : 'Uninvoiced';

  return {
    id: `j${i + 1}`,
    clientId: `c${(i % 10) + 1}`,
    serviceType: i % 5 === 0 ? 'Deep Clean' : i % 7 === 0 ? 'Commercial' : 'Regular',
    recurrence: 'Weekly',
    scheduledDate: getSpreadDate(i),
    startTime: `${(8 + (i % 4))}:00`,
    estimatedHours: 2 + (i % 3),
    staffNeeded: i % 4 === 0 ? 2 : 1,
    status: status,
    invoiceStatus: invoiceStatus,
    assignedEmployeeIds: assignedEmployeeIds,
    assignedRoles: {},
    address: `Tactical Location ${i + 1}`,
    totalPrice: 150 + (i * 10),
    checklist: [
      { id: '1', task: 'Sanitize high-touch surfaces', completed: i < 5 },
      { id: '2', task: 'Check waste bins', completed: i < 5 },
      { id: '3', task: 'Verify entrance security', completed: i < 5 }
    ],
    photos: { before: [], after: [] }
  };
});

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv1',
    jobId: 'j1',
    clientId: 'c1',
    invoiceNumber: 'INV-1001',
    date: '2023-10-01',
    dueDate: '2023-10-15',
    status: 'Paid',
    subtotal: 90.00,
    taxRate: 19,
    taxAmount: 17.10,
    discount: 0,
    totalAmount: 107.10,
    notes: 'Sample paid invoice'
  },
  {
    id: 'inv2',
    jobId: 'j2',
    clientId: 'c2',
    invoiceNumber: 'INV-1002',
    date: '2023-10-05',
    dueDate: '2023-10-19',
    status: 'Paid',
    subtotal: 105.00,
    taxRate: 19,
    taxAmount: 19.95,
    discount: 5.00,
    totalAmount: 119.95,
    notes: 'Sample paid invoice with discount'
  },
  {
    id: 'inv3',
    jobId: 'j3',
    clientId: 'c3',
    invoiceNumber: 'INV-1003',
    date: '2023-10-10',
    dueDate: '2023-10-24',
    status: 'Sent',
    subtotal: 70.00,
    taxRate: 19,
    taxAmount: 13.30,
    discount: 0,
    totalAmount: 83.30,
    notes: 'Sample sent invoice'
  },
  {
    id: 'inv4',
    jobId: 'j4',
    clientId: 'c4',
    invoiceNumber: 'INV-1004',
    date: '2023-10-12',
    dueDate: '2023-10-26',
    status: 'Sent',
    subtotal: 135.00,
    taxRate: 19,
    taxAmount: 25.65,
    discount: 0,
    totalAmount: 160.65,
    notes: 'Large commercial invoice'
  }
];

export const INITIAL_LOGS: TimeLog[] = [];
export const INITIAL_ABSENCES: Absence[] = [];
