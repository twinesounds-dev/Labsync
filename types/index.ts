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
  patientType: 'walk-in' | 'referral' | 'inpatient'; // Patient type for workflow
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
  // For Referral patients (has lab request form from doctor)
  requestFormNumber?: string;
  requestingPhysician?: string;
  clinicalDiagnosis?: string;
  requestedTests?: string;
  
  // For Inpatients (can be referred between facilities)
  originFacilityId?: string; // If referred from another facility
  referredFromFacility?: string; // Facility name
  referredToFacilityId?: string; // If referred to another facility
  referralReason?: string; // Why referred (e.g., tests not available)
  
  // For Walk-in patients (clerk creates lab request first)
  requiresClerkRequest: boolean; // True for walk-in patients
  
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

// Test Normal Range (Enhanced with Clinical Reporting)
export interface TestNormalRange {
  id: string;
  testId: string;
  parameter: string;
  unit: string;
  
  // Gender-specific ranges
  normalRangeMale?: string;
  normalRangeFemale?: string;
  normalRangeGeneral?: string;
  
  // Numeric ranges for automatic flagging
  normalMinMale?: number;
  normalMaxMale?: number;
  normalMinFemale?: number;
  normalMaxFemale?: number;
  normalMinGeneral?: number;
  normalMaxGeneral?: number;
  
  // Critical thresholds
  criticalLowMale?: number;
  criticalHighMale?: number;
  criticalLowFemale?: number;
  criticalHighFemale?: number;
  criticalLowGeneral?: number;
  criticalHighGeneral?: number;
  
  // Age-based ranges
  ageGroup?: string; // e.g., "Adult", "Child", "Infant"
  ageMin?: number; // Minimum age in years
  ageMax?: number; // Maximum age in years
  
  // Range type
  rangeType: 'numeric' | 'qualitative' | 'category';
  
  // For qualitative tests (e.g., Positive/Negative)
  normalValue?: string; // e.g., "Negative", "Non-Reactive"
  abnormalValues?: string[]; // e.g., ["Positive", "Reactive"]
  
  // Configuration
  isEditable: boolean;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt?: Date;
}

// Clinical Interpretation Template
export interface ClinicalInterpretationTemplate {
  id: string;
  testId?: string; // If specific to a test
  categoryId?: string; // If specific to a category
  
  // Trigger conditions
  triggerType: 'single_parameter' | 'multiple_parameters' | 'pattern' | 'critical_value';
  triggerParameters?: string[]; // Parameters that trigger this interpretation
  triggerConditions?: {
    parameter: string;
    condition: 'high' | 'low' | 'critical_high' | 'critical_low' | 'positive' | 'negative';
  }[];
  
  // Interpretation content
  title: string;
  interpretation: string;
  clinicalSignificance?: string;
  recommendations?: string[];
  urgencyLevel: 'routine' | 'attention_required' | 'urgent' | 'critical';
  
  // Alert configuration
  requiresNotification: boolean;
  notificationRecipients?: string[]; // Role or user IDs
  
  // Customization
  isSystemGenerated: boolean;
  isEditable: boolean;
  isActive: boolean;
  
  createdAt: Date;
  updatedAt?: Date;
  createdBy?: string;
}

// Clinical Report Data
export interface ClinicalReportData {
  id: string;
  testResultId: string;
  testResult?: TestResult;
  patientId: string;
  patient?: Patient;
  facilityId: string;
  
  // Auto-generated interpretation
  autoInterpretation?: string;
  autoInterpretationTemplateIds?: string[];
  
  // Clinical findings
  abnormalFindings: {
    parameter: string;
    value: string | number;
    flag: string;
    normalRange: string;
    clinicalSignificance: string;
  }[];
  
  criticalAlerts: {
    parameter: string;
    value: string | number;
    criticalThreshold: string;
    urgencyLevel: 'urgent' | 'critical';
    recommendation: string;
  }[];
  
  // Owner customization
  ownerInterpretation?: string;
  ownerNotes?: string;
  additionalRecommendations?: string[];
  followUpInstructions?: string;
  
  // Final combined interpretation
  finalInterpretation: string;
  
  // Clinical context
  clinicalCorrelation?: string;
  differentialDiagnosis?: string[];
  
  // Report metadata
  reportGeneratedAt: Date;
  reportApprovedAt?: Date;
  reportApprovedBy?: string;
  
  createdAt: Date;
  updatedAt?: Date;
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

// Test Result Value (Enhanced)
export interface ResultValue {
  parameter: string;
  value: string | number;
  unit: string;
  normalRange: string;
  flag: 'Normal' | 'Low' | 'High' | 'Critical Low' | 'Critical High' | 'Critical' | 'N/A';
  
  // Additional context
  interpretation?: string; // Brief interpretation of this specific result
  clinicalSignificance?: string; // What this abnormal value might indicate
  
  // Reference data
  normalRangeId?: string; // Reference to TestNormalRange
  genderSpecific?: boolean;
  ageSpecific?: boolean;
}

// Test Result (Enhanced with Clinical Reporting)
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
  
  // Clinical Reporting (NEW)
  clinicalReportId?: string;
  clinicalReport?: ClinicalReportData;
  
  autoInterpretation?: string; // System-generated interpretation
  ownerInterpretation?: string; // Owner-customized interpretation
  finalInterpretation?: string; // Combined interpretation for report
  
  clinicalNotes?: string; // Additional clinical notes from owner
  recommendations?: string[]; // Clinical recommendations
  criticalAlerts?: string[]; // Critical findings requiring attention
  
  // Flags for quick filtering
  hasCriticalValues?: boolean;
  hasAbnormalValues?: boolean;
  requiresUrgentAction?: boolean;
  
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
  reportReadyForPrint?: boolean;
  sentToReceptionAt?: Date;
  
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

// Financial Management
export interface DailyIncome {
  id: string;
  facilityId: string;
  date: string; // YYYY-MM-DD
  cash: number;
  mobileMoney: {
    mtn: number;
    airtel: number;
  };
  insurance: number;
  card: number;
  total: number;
  transactionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Expenditure {
  id: string;
  facilityId: string;
  category: 'consumables' | 'salaries' | 'utilities' | 'maintenance' | 'rent' | 'equipment' | 'marketing' | 'other';
  amount: number;
  description: string;
  date: Date;
  approvedBy?: string; // User ID (Owner)
  receipt?: string; // Storage URL
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialSummary {
  facilityId: string;
  period: string; // YYYY-MM or YYYY-MM-DD
  grossIncome: number;
  totalExpenses: number;
  netProfit: number;
  taxAmount: number; // Calculated based on Uganda tax rules
  breakdown: {
    cash: number;
    mobileMoney: number;
    insurance: number;
    card: number;
  };
  expensesByCategory: Record<string, number>;
}

// Inventory & Consumables
export interface InventoryItem {
  id: string;
  facilityId: string;
  name: string;
  category: 'test_kits' | 'sample_containers' | 'safety_equipment' | 'reagents' | 'disposables' | 'other';
  description?: string;
  currentStock: number;
  minimumStock: number;
  unit: string; // "strips", "pairs", "tubes", "ml", "units"
  costPerUnit: number;
  supplier?: string;
  lastRestockDate?: Date;
  expiryDate?: Date;
  testsUsing: string[]; // Test IDs that use this consumable
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsumableUsage {
  id: string;
  facilityId: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  testResultId?: string; // If used during test
  testRequestId?: string; // If used during sample collection
  quantity: number;
  usedBy: string; // User ID
  usedByUser?: User;
  usageType: 'test' | 'sample_collection' | 'quality_control' | 'other';
  notes?: string;
  date: Date;
  createdAt: Date;
}

export interface StockAlert {
  id: string;
  facilityId: string;
  inventoryItemId: string;
  inventoryItem?: InventoryItem;
  alertType: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  createdAt: Date;
}

// Human Resources & Attendance
export interface Employee {
  id: string;
  userId: string; // References User table
  user?: User;
  facilityId: string;
  employeeNumber: string;
  position: string;
  department: string;
  salary: number;
  hireDate: Date;
  contractType: 'permanent' | 'contract' | 'temporary';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: Employee;
  facilityId: string;
  date: string; // YYYY-MM-DD
  checkIn?: Date;
  checkOut?: Date;
  hoursWorked: number;
  status: 'present' | 'absent' | 'late' | 'on_leave' | 'half_day';
  notes?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: Employee;
  facilityId: string;
  leaveType: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'unpaid';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedDate: Date;
  reviewedBy?: string; // User ID (Owner)
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceMetrics {
  id: string;
  employeeId: string;
  facilityId: string;
  period: string; // YYYY-MM
  testsProcessed: number;
  averageProcessingTime: number; // minutes
  qualityScore: number; // 0-100
  attendanceRate: number; // percentage
  customerFeedback: number; // 0-5 stars
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Facility Configuration
export interface FacilityConfiguration {
  id: string;
  facilityId: string;
  defaultTests: string[]; // Test IDs that are available at this facility
  operatingHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  taxRate: number; // Percentage
  enabledPaymentMethods: string[];
  notificationSettings: {
    lowStockAlerts: boolean;
    attendanceReminders: boolean;
    pendingApprovals: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
