// User Roles
export type UserRole = 'receptionist' | 'clerk' | 'lab_tech' | 'owner';

// Facilities
export interface Facility {
  id: string;
  name: string;
  code: string; // FLNT, FLMB, PCMC
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  facilityId: string;
  facility?: Facility;
  phone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Patient
export interface Patient {
  id: string;
  patientId: string; // FacilityCode-PatientNumber: FLNT-00123
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
  
  // External Referral
  isExternalReferral: boolean;
  externalRequestForm?: string; // Storage URL
  
  // Pathway-specific fields
  // For Pathway 1 (Referred patients)
  requestFormNumber?: string;
  requestingPhysician?: string;
  clinicalDiagnosis?: string;
  requestedTests?: string;
  
  // For Pathway 2 (Inpatients)
  labRequestForm?: {
    requestNumber: string;
    requestDate: Date;
    clinicalHistory: string;
    clinicalDiagnosis: string;
    requestingPhysician: string;
    selectedTests: string[];
    urgency: 'Routine' | 'Urgent' | 'STAT';
    specialInstructions: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Test Category
export interface TestCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

// Test
export interface Test {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category?: TestCategory;
  price: number; // UGX
  turnaroundTime: string; // e.g., "2 hours", "24 hours"
  sampleType: string; // blood, urine, stool, etc.
  containerType?: string;
  storageRequirements?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Test Normal Range
export interface TestNormalRange {
  id: string;
  testId: string;
  parameter: string;
  unit: string;
  normalRangeMale?: string;
  normalRangeFemale?: string;
  normalRangeGeneral?: string;
  ageGroup?: string; // e.g., "Adult", "Child", "Infant"
  createdAt: Date;
}

// Test Request
export interface TestRequest {
  id: string;
  patientId: string;
  patient?: Patient;
  facilityId: string;
  requestDate: Date;
  requestedBy: string; // User ID (Receptionist/Clerk)
  requestedByUser?: User;
  
  // Tests
  tests: {
    testId: string;
    test?: Test;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
    price: number;
  }[];
  
  // Sample Information
  sampleCollectionDate?: Date;
  sampleReceivedDate?: Date;
  sampleReceivedBy?: string; // User ID (Clerk)
  clerkNotes?: string;
  sampleCollectionData?: any; // Sample collection and QA data
  sampleQualityNotes?: string;
  
  // Payment
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  
  // Status
  overallStatus: 'Pending' | 'SampleReceived' | 'InProgress' | 'Completed' | 'Approved';
  
  createdAt: Date;
  updatedAt: Date;
}

// Test Result Value
export interface ResultValue {
  parameter: string;
  value: string | number;
  unit: string;
  normalRange: string;
  flag: 'Normal' | 'Low' | 'High' | 'Critical' | 'N/A';
}

// Test Result
export interface TestResult {
  id: string;
  testRequestId: string;
  testRequest?: TestRequest;
  testId: string;
  test?: Test;
  patientId: string;
  patient?: Patient;
  facilityId: string;
  
  // Results
  resultValues: ResultValue[];
  remarks?: string;
  
  // Workflow
  datePerformed: Date;
  performedBy: string; // User ID (Lab Tech)
  performedByUser?: User;
  
  dateSubmitted?: Date;
  dateApproved?: Date;
  approvedBy?: string; // User ID (Owner)
  approvedByUser?: User;
  
  // Printing Information
  printedBy?: string;
  printedDate?: Date;
  
  status: 'Pending' | 'Submitted' | 'Approved' | 'Rejected' | 'Printed';
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Payment
export interface Payment {
  id: string;
  patientId: string;
  patient?: Patient;
  testRequestId: string;
  testRequest?: TestRequest;
  facilityId: string;
  invoiceNumber: string;
  
  // Amount
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  
  // Payment Details
  paymentMethod: 'Cash' | 'Mobile Money' | 'Card' | 'Insurance';
  mobileMoneyProvider?: 'MTN' | 'Airtel';
  mobileMoneyNumber?: string;
  transactionId?: string;
  insuranceClaimNumber?: string;
  
  // Workflow
  paymentDate: Date;
  receivedBy: string; // User ID (Receptionist)
  receivedByUser?: User;
  status: 'Paid' | 'Partial' | 'Pending';
  
  createdAt: Date;
  updatedAt: Date;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  user?: User;
  userRole: UserRole;
  action: string;
  entity: 'Patient' | 'TestRequest' | 'TestResult' | 'Payment' | 'User';
  entityId: string;
  facilityId: string;
  facility?: Facility;
  timestamp: Date;
  ipAddress?: string;
  details: Record<string, any>;
}

// Dashboard Stats
export interface FacilityStats {
  totalPatients: number;
  todayPatients: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingApprovals: number;
  testsToday: number;
  pendingPayments: number;
  patientsWaitingForSamples: number;
  patientsWaitingForReports: number;
}
