import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { FacilityStats } from '@/types';

export function useRealtimeStats(facilityId: string) {
  const [stats, setStats] = useState<FacilityStats>({
    totalPatients: 0,
    todayPatients: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    pendingApprovals: 0,
    testsToday: 0,
    pendingPayments: 0,
    patientsWaitingForSamples: 0,
    patientsWaitingForReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facilityId) {
      setLoading(false);
      return;
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Timestamp.fromDate(today);

    // Subscribe to patients
    const patientsQuery = query(
      collection(db, COLLECTIONS.PATIENTS),
      where('facilityId', '==', facilityId)
    );

    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      const totalPatients = snapshot.size;
      const todayPatients = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.createdAt >= todayTimestamp;
      }).length;

      setStats((prev) => ({ ...prev, totalPatients, todayPatients }));
    });

    // Subscribe to payments for revenue
    const paymentsQuery = query(
      collection(db, COLLECTIONS.PAYMENTS),
      where('facilityId', '==', facilityId)
    );

    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      let totalRevenue = 0;
      let todayRevenue = 0;
      let pendingPayments = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalRevenue += data.total || 0;
        
        if (data.createdAt >= todayTimestamp) {
          todayRevenue += data.total || 0;
        }

        if (data.status === 'Pending' || data.status === 'Partial') {
          pendingPayments++;
        }
      });

      setStats((prev) => ({ ...prev, totalRevenue, todayRevenue, pendingPayments }));
    });

    // Subscribe to test requests
    const testRequestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('facilityId', '==', facilityId)
    );

    const unsubscribeTestRequests = onSnapshot(testRequestsQuery, (snapshot) => {
      let testsToday = 0;
      let patientsWaitingForSamples = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        
        if (data.createdAt >= todayTimestamp) {
          testsToday += data.tests?.length || 0;
        }

        if (data.paymentStatus === 'Paid' && !data.sampleReceivedDate) {
          patientsWaitingForSamples++;
        }
      });

      setStats((prev) => ({ ...prev, testsToday, patientsWaitingForSamples }));
    });

    // Subscribe to test results for approvals
    const testResultsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('facilityId', '==', facilityId)
    );

    const unsubscribeTestResults = onSnapshot(testResultsQuery, (snapshot) => {
      const pendingApprovals = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.status === 'Submitted';
      }).length;

      const patientsWaitingForReports = snapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.status === 'Approved';
      }).length;

      setStats((prev) => ({ ...prev, pendingApprovals, patientsWaitingForReports }));
    });

    setLoading(false);

    return () => {
      unsubscribePatients();
      unsubscribePayments();
      unsubscribeTestRequests();
      unsubscribeTestResults();
    };
  }, [facilityId]);

  return { stats, loading };
}
