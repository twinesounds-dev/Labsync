// User Roles
export type UserRole = 'receptionist' | 'clerk' | 'lab_technician' | 'owner' | 'admin';

// Facility Types
export interface Facility {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  facilityId: string;
  facility?: Facility;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

// Patient Types
export interface Patient {
  id: string;
  patientId: string; // Format: FacilityCode-PatientNumber (e.g., FLNT-00123)
  facilityId: string;
  facility?: Facility;
  registrationDate: Date;
  
  // Personal Details
  surname: string;
  givenName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  
  // Contact Information
  phoneNumber: string;
  email?: string;
  address: {
    village: string;
    parish: string;
    subCounty: string;
    district: string;
  };
  
  // Identification
  nationalID?: string;
  passportNumber?: string;
  NIN?: string;
  
  // Medical Information
  referringDoctor?: string;
  hospitalClinic?: string;
  clinicalHistory?: string;
  urgency: 'Routine' | 'Urgent' | 'STAT';
  
  // Payment Information
  paymentType: 'Cash' | 'Insurance' | 'Corporate';
  insuranceProvider?: string;
  insuranceNumber?: string;
  corporateClient?: string;
  
  // System Fields
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Test Categories and Tests
export interface TestCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Test {
  id: string;
  categoryId: string;
  category?: TestCategory;
  name: string;
  code: string;
  price: number; // in UGX
  turnaroundTime: string;
  sampleType: 'Blood' | 'Urine' | 'Stool' | 'Sputum' | 'Other';
  containerType?: string;
  storageRequirements?: string;
  normalRanges: NormalRange[];
  isActive: boolean;
  createdAt: Date;
}

export interface NormalRange {
  id: string;
  parameter: string;
  unit: string;
  minValue?: number;
  maxValue?: number;
  normalValue?: string; // for qualitative tests
  gender?: 'Male' | 'Female' | 'Both';
  ageMin?: number;
  ageMax?: number;
  flag: 'Normal' | 'Low' | 'High' | 'Critical';
}

// Test Request Types
export interface TestRequest {
  id: string;
  patientId: string;
  patient?: Patient;
  facilityId: string;
  facility?: Facility;
  tests: TestRequestItem[];
  urgency: 'Routine' | 'Urgent' | 'STAT';
  referringDoctor?: string;
  hospitalClinic?: string;
  clinicalHistory?: string;
  specialInstructions?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  requestedBy: string; // User ID
  requestedAt: Date;
  completedAt?: Date;
  clerkNotes?: string;
  technicianNotes?: string;
}

export interface TestRequestItem {
  testId: string;
  test?: Test;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  priority: number;
}

// Test Results
export interface TestResult {
  id: string;
  testRequestId: string;
  testRequest?: TestRequest;
  testId: string;
  test?: Test;
  patientId: string;
  patient?: Patient;
  technicianId: string;
  technician?: User;
  resultValues: ResultValue[];
  remarks?: string;
  datePerformed: Date;
  dateApproved?: Date;
  approvedBy?: string;
  approver?: User;
  status: 'Pending' | 'Completed' | 'Approved' | 'Rejected';
  qualityControl?: QualityControl;
}

export interface ResultValue {
  parameter: string;
  value: string | number;
  unit: string;
  normalRange: string;
  flag: 'Normal' | 'Low' | 'High' | 'Critical';
  isAbnormal: boolean;
}

export interface QualityControl {
  controlSample?: string;
  controlValue?: string;
  isPassed: boolean;
  notes?: string;
}

// Payment Types
export interface Payment {
  id: string;
  patientId: string;
  patient?: Patient;
  facilityId: string;
  facility?: Facility;
  invoiceNumber: string;
  tests: PaymentTest[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethod: 'Cash' | 'Mobile Money' | 'Card' | 'Insurance';
  mobileMoneyNumber?: string;
  mobileMoneyProvider?: 'MTN' | 'Airtel';
  transactionId?: string;
  receivedBy: string;
  receivedByUser?: User;
  paymentDate: Date;
  status: 'Paid' | 'Partial' | 'Pending' | 'Cancelled';
  notes?: string;
}

export interface PaymentTest {
  testId: string;
  test?: Test;
  name: string;
  price: number;
}

// External Request Types
export interface ExternalRequest {
  id: string;
  patientType: 'Walk-in' | 'Referred';
  referringHospital: string;
  doctorName: string;
  requestFormUrl?: string; // Firebase Storage URL
  testsRequested: string[];
  urgency: 'Routine' | 'Urgent';
  specialInstructions?: string;
  facilityId: string;
  facility?: Facility;
  status: 'Pending' | 'Processed' | 'Cancelled';
  createdAt: Date;
  processedAt?: Date;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  userRole: UserRole;
  action: string;
  patientId?: string;
  testId?: string;
  paymentId?: string;
  timestamp: Date;
  ipAddress: string;
  facility: string;
  details: any;
}

// Dashboard Types
export interface DashboardStats {
  totalPatients: number;
  totalRevenue: number;
  pendingApprovals: number;
  testsToday: number;
  testsCompleted: number;
  testsPending: number;
  averageTurnaroundTime: number;
}

export interface FacilityDashboard extends DashboardStats {
  facilityId: string;
  facility?: Facility;
  date: Date;
}

// Report Types
export interface LabReport {
  id: string;
  patientId: string;
  patient?: Patient;
  testRequestId: string;
  testRequest?: TestRequest;
  facilityId: string;
  facility?: Facility;
  reportNumber: string;
  dateCollected: Date;
  dateReported: Date;
  technician: string;
  approvedBy: string;
  results: TestResult[];
  comments?: string;
  isPrinted: boolean;
  printedAt?: Date;
  printedBy?: string;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  user?: User;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

// System Configuration
export interface SystemConfig {
  id: string;
  facilityId: string;
  facility?: Facility;
  key: string;
  value: any;
  description?: string;
  updatedBy: string;
  updatedAt: Date;
}