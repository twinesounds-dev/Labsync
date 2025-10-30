import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

// Helper function to convert Firestore Timestamp to Date
export const timestampToDate = (timestamp: unknown): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return new Date();
};

// Generic Firestore operations
export const firestoreService = {
  // Create
  async create<T>(collectionName: string, data: Partial<T>): Promise<string> {
    const docData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, collectionName), docData);
    return docRef.id;
  },

  // Read single document
  async getById<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  },

  // Read all documents
  async getAll<T>(
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<T[]> {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  },

  // Update
  async update<T>(
    collectionName: string,
    id: string,
    data: Partial<T>
  ): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  // Delete
  async delete(collectionName: string, id: string): Promise<void> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },

  // Query with conditions
  async queryDocuments<T>(
    collectionName: string,
    constraints: QueryConstraint[]
  ): Promise<T[]> {
    return this.getAll<T>(collectionName, constraints);
  },
};

// Collection names
export const COLLECTIONS = {
  FACILITIES: 'facilities',
  USERS: 'users',
  PATIENTS: 'patients',
  TEST_CATEGORIES: 'test_categories',
  TESTS: 'tests',
  TEST_NORMAL_RANGES: 'test_normal_ranges',
  TEST_REQUESTS: 'test_requests',
  TEST_RESULTS: 'test_results',
  PAYMENTS: 'payments',
  AUDIT_LOGS: 'audit_logs',
  // Multi-facility management
  DAILY_INCOME: 'daily_income',
  EXPENDITURES: 'expenditures',
  FINANCIAL_SUMMARIES: 'financial_summaries',
  INVENTORY_ITEMS: 'inventory_items',
  CONSUMABLE_USAGE: 'consumable_usage',
  STOCK_ALERTS: 'stock_alerts',
  EMPLOYEES: 'employees',
  ATTENDANCE_RECORDS: 'attendance_records',
  LEAVE_REQUESTS: 'leave_requests',
  PERFORMANCE_METRICS: 'performance_metrics',
  FACILITY_CONFIGURATIONS: 'facility_configurations',
};
