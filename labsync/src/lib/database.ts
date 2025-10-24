import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Patient,
  Test,
  TestCategory,
  TestRequest,
  TestResult,
  Payment,
  Facility,
  User,
  AuditLog,
  LabReport,
  ExternalRequest,
  Notification,
  SystemConfig,
} from './types';

// Collection names
const COLLECTIONS = {
  FACILITIES: 'facilities',
  USERS: 'users',
  PATIENTS: 'patients',
  TEST_CATEGORIES: 'testCategories',
  TESTS: 'tests',
  TEST_REQUESTS: 'testRequests',
  TEST_RESULTS: 'testResults',
  PAYMENTS: 'payments',
  LAB_REPORTS: 'labReports',
  EXTERNAL_REQUESTS: 'externalRequests',
  AUDIT_LOGS: 'auditLogs',
  NOTIFICATIONS: 'notifications',
  SYSTEM_CONFIG: 'systemConfig',
};

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data: any): any => {
  if (!data) return data;
  
  const converted = { ...data };
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    } else if (typeof converted[key] === 'object' && converted[key] !== null) {
      converted[key] = convertTimestamps(converted[key]);
    }
  });
  
  return converted;
};

// Facility operations
export const facilityService = {
  async getAll(): Promise<Facility[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.FACILITIES));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Facility[];
  },

  async getById(id: string): Promise<Facility | null> {
    const docRef = doc(db, COLLECTIONS.FACILITIES, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Facility;
    }
    return null;
  },

  async create(facility: Omit<Facility, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.FACILITIES), {
      ...facility,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<Facility>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.FACILITIES, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },
};

// Patient operations
export const patientService = {
  async getAll(facilityId?: string): Promise<Patient[]> {
    let q = query(collection(db, COLLECTIONS.PATIENTS), orderBy('createdAt', 'desc'));
    
    if (facilityId) {
      q = query(
        collection(db, COLLECTIONS.PATIENTS),
        where('facilityId', '==', facilityId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Patient[];
  },

  async getById(id: string): Promise<Patient | null> {
    const docRef = doc(db, COLLECTIONS.PATIENTS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Patient;
    }
    return null;
  },

  async getByPatientId(patientId: string): Promise<Patient | null> {
    const q = query(
      collection(db, COLLECTIONS.PATIENTS),
      where('patientId', '==', patientId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as Patient;
  },

  async create(patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.PATIENTS), {
      ...patient,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<Patient>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PATIENTS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async search(query: string, facilityId?: string): Promise<Patient[]> {
    // This is a simplified search - in production, you'd want to use Algolia or similar
    const allPatients = await this.getAll(facilityId);
    const searchTerm = query.toLowerCase();
    
    return allPatients.filter(patient => 
      patient.surname.toLowerCase().includes(searchTerm) ||
      patient.givenName.toLowerCase().includes(searchTerm) ||
      patient.patientId.toLowerCase().includes(searchTerm) ||
      patient.phoneNumber.includes(query)
    );
  },
};

// Test Category operations
export const testCategoryService = {
  async getAll(): Promise<TestCategory[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.TEST_CATEGORIES));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as TestCategory[];
  },

  async getById(id: string): Promise<TestCategory | null> {
    const docRef = doc(db, COLLECTIONS.TEST_CATEGORIES, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as TestCategory;
    }
    return null;
  },

  async create(category: Omit<TestCategory, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TEST_CATEGORIES), {
      ...category,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<TestCategory>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TEST_CATEGORIES, id);
    await updateDoc(docRef, updates);
  },
};

// Test operations
export const testService = {
  async getCategories(): Promise<TestCategory[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.TEST_CATEGORIES));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as TestCategory[];
  },

  async getTestsByCategory(categoryId?: string): Promise<Test[]> {
    let q = query(collection(db, COLLECTIONS.TESTS), where('isActive', '==', true));
    
    if (categoryId) {
      q = query(
        collection(db, COLLECTIONS.TESTS),
        where('categoryId', '==', categoryId),
        where('isActive', '==', true)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Test[];
  },

  async getById(id: string): Promise<Test | null> {
    const docRef = doc(db, COLLECTIONS.TESTS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Test;
    }
    return null;
  },

  async create(test: Omit<Test, 'id' | 'createdAt'>): Promise<string> {
    // Create a clean test object with only defined values
    const cleanedTest: any = {
      categoryId: test.categoryId,
      name: test.name,
      code: test.code,
      price: test.price,
      turnaroundTime: test.turnaroundTime,
      sampleType: test.sampleType,
      normalRanges: test.normalRanges,
      isActive: test.isActive,
    };
    
    // Only add optional fields if they have values
    if (test.storageRequirements !== undefined) {
      cleanedTest.storageRequirements = test.storageRequirements;
    }
    if (test.containerType !== undefined) {
      cleanedTest.containerType = test.containerType;
    }
    
    const docRef = await addDoc(collection(db, COLLECTIONS.TESTS), {
      ...cleanedTest,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<Test>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TESTS, id);
    await updateDoc(docRef, updates);
  },
};

// Test Request operations
export const testRequestService = {
  async getAll(facilityId?: string): Promise<TestRequest[]> {
    let q = query(collection(db, COLLECTIONS.TEST_REQUESTS), orderBy('requestedAt', 'desc'));
    
    if (facilityId) {
      q = query(
        collection(db, COLLECTIONS.TEST_REQUESTS),
        where('facilityId', '==', facilityId),
        orderBy('requestedAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as TestRequest[];
  },

  async getById(id: string): Promise<TestRequest | null> {
    const docRef = doc(db, COLLECTIONS.TEST_REQUESTS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as TestRequest;
    }
    return null;
  },

  async create(testRequest: Omit<TestRequest, 'id' | 'requestedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TEST_REQUESTS), {
      ...testRequest,
      requestedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<TestRequest>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TEST_REQUESTS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  async getByStatus(status: string, facilityId?: string): Promise<TestRequest[]> {
    let q = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('status', '==', status),
      orderBy('requestedAt', 'desc')
    );
    
    if (facilityId) {
      q = query(
        collection(db, COLLECTIONS.TEST_REQUESTS),
        where('facilityId', '==', facilityId),
        where('status', '==', status),
        orderBy('requestedAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as TestRequest[];
  },
};

// Test Result operations
export const testResultService = {
  async getAll(facilityId?: string): Promise<TestResult[]> {
    let q = query(collection(db, COLLECTIONS.TEST_RESULTS), orderBy('datePerformed', 'desc'));
    
    if (facilityId) {
      q = query(
        collection(db, COLLECTIONS.TEST_RESULTS),
        where('facilityId', '==', facilityId),
        orderBy('datePerformed', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as TestResult[];
  },

  async getById(id: string): Promise<TestResult | null> {
    const docRef = doc(db, COLLECTIONS.TEST_RESULTS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as TestResult;
    }
    return null;
  },

  async create(testResult: Omit<TestResult, 'id' | 'datePerformed'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.TEST_RESULTS), {
      ...testResult,
      datePerformed: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<TestResult>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TEST_RESULTS, id);
    await updateDoc(docRef, updates);
  },

  async getByStatus(status: string, facilityId?: string): Promise<TestResult[]> {
    let q = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('status', '==', status),
      orderBy('datePerformed', 'desc')
    );
    
    if (facilityId) {
      q = query(
        collection(db, COLLECTIONS.TEST_RESULTS),
        where('facilityId', '==', facilityId),
        where('status', '==', status),
        orderBy('datePerformed', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as TestResult[];
  },
};

// Payment operations
export const paymentService = {
  async getAll(facilityId?: string): Promise<Payment[]> {
    let q = query(collection(db, COLLECTIONS.PAYMENTS), orderBy('paymentDate', 'desc'));
    
    if (facilityId) {
      q = query(
        collection(db, COLLECTIONS.PAYMENTS),
        where('facilityId', '==', facilityId),
        orderBy('paymentDate', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as Payment[];
  },

  async getById(id: string): Promise<Payment | null> {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...convertTimestamps(docSnap.data()),
      } as Payment;
    }
    return null;
  },

  async create(payment: Omit<Payment, 'id' | 'paymentDate'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTIONS.PAYMENTS), {
      ...payment,
      paymentDate: serverTimestamp(),
    });
    return docRef.id;
  },

  async update(id: string, updates: Partial<Payment>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PAYMENTS, id);
    await updateDoc(docRef, updates);
  },
};

// Audit Log operations
export const auditService = {
  async log(action: string, details: any, userId: string, userRole: string, facility: string, patientId?: string, testId?: string, paymentId?: string): Promise<void> {
    const auditLog: Omit<AuditLog, 'id'> = {
      userId,
      userRole: userRole as any,
      action,
      patientId,
      testId,
      paymentId,
      timestamp: new Date(),
      ipAddress: 'unknown', // In a real app, you'd get this from the request
      facility,
      details,
    };

    await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
      ...auditLog,
      timestamp: serverTimestamp(),
    });
  },

  async getLogs(facilityId?: string, limitCount: number = 100): Promise<AuditLog[]> {
    let q = query(
      collection(db, COLLECTIONS.AUDIT_LOGS),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    if (facilityId) {
      q = query(
        collection(db, COLLECTIONS.AUDIT_LOGS),
        where('facility', '==', facilityId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    })) as AuditLog[];
  },
};

// Utility functions
export const generatePatientId = (facilityCode: string, patientNumber: number): string => {
  return `${facilityCode}-${patientNumber.toString().padStart(5, '0')}`;
};

export const generateInvoiceNumber = (facilityCode: string, date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${facilityCode}-${year}${month}${day}-${random}`;
};

export const generateReportNumber = (facilityCode: string, date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RPT-${facilityCode}-${year}${month}${day}-${random}`;
};