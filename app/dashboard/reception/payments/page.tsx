'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { Patient, TestRequest, Payment } from '@/types';
import { format } from 'date-fns';

export default function PaymentsPage() {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TestRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'Cash' as 'Cash' | 'Mobile Money' | 'Card' | 'Insurance',
    mobileMoneyProvider: 'MTN' as 'MTN' | 'Airtel',
    mobileMoneyNumber: '',
    transactionId: '',
    amountPaid: '',
  });

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Subscribe to patients with pending payments
    const patientsQuery = query(
      collection(db, COLLECTIONS.PATIENTS),
      where('facilityId', '==', userProfile.facilityId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
      const patientsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate() || new Date(),
        dateOfBirth: doc.data().dateOfBirth?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Patient[];

      setPatients(patientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  useEffect(() => {
    if (!selectedPatient) return;

    const requestsQuery = query(
      collection(db, COLLECTIONS.TEST_REQUESTS),
      where('patientId', '==', selectedPatient.id),
      where('paymentStatus', '!=', 'Paid')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        requestDate: doc.data().requestDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TestRequest[];

      setTestRequests(requestsData);
    });

    return () => unsubscribe();
  }, [selectedPatient]);

  const handleProcessPayment = async () => {
    if (!selectedRequest || !selectedPatient || !userProfile) return;

    setSubmitting(true);

    try {
      const totalAmount = selectedRequest.tests.reduce(
        (sum, test) => sum + test.price,
        0
      );
      const amountPaid = parseFloat(paymentData.amountPaid);

      if (amountPaid < totalAmount) {
        alert(`Insufficient payment. Total required: UGX ${totalAmount.toLocaleString()}`);
        setSubmitting(false);
        return;
      }

      // Generate invoice number
      const invoiceNumber = `INV-${selectedPatient.patientId}-${Date.now()}`;

      // Create payment record
      await firestoreService.create<Payment>(COLLECTIONS.PAYMENTS, {
        patientId: selectedPatient.id,
        testRequestId: selectedRequest.id,
        facilityId: userProfile.facilityId,
        invoiceNumber,
        subtotal: totalAmount,
        discount: 0,
        tax: 0,
        total: totalAmount,
        amountPaid,
        balance: amountPaid - totalAmount,
        paymentMethod: paymentData.paymentMethod,
        mobileMoneyProvider:
          paymentData.paymentMethod === 'Mobile Money'
            ? paymentData.mobileMoneyProvider
            : undefined,
        mobileMoneyNumber:
          paymentData.paymentMethod === 'Mobile Money'
            ? paymentData.mobileMoneyNumber
            : undefined,
        transactionId: paymentData.transactionId || undefined,
        paymentDate: new Date(),
        receivedBy: userProfile.id,
        status: 'Paid',
      } as Partial<Payment>);

      // Update test request payment status
      await firestoreService.update(COLLECTIONS.TEST_REQUESTS, selectedRequest.id, {
        paymentStatus: 'Paid',
      });

      alert(`Payment processed successfully!\nInvoice: ${invoiceNumber}`);

      // Reset form
      setSelectedPatient(null);
      setSelectedRequest(null);
      setPaymentData({
        paymentMethod: 'Cash',
        mobileMoneyProvider: 'MTN',
        mobileMoneyNumber: '',
        transactionId: '',
        amountPaid: '',
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.givenName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Process Payments</h1>
            <p className="text-gray-600 mt-1">Record patient test payments</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Selection */}
          <Card title="Select Patient">
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredPatients.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No patients found
                </p>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPatient?.id === patient.id
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {patient.patientId}
                    </div>
                    <div className="text-sm text-gray-600">
                      {patient.surname} {patient.givenName}
                    </div>
                    <div className="text-xs text-gray-500">{patient.phoneNumber}</div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Payment Form */}
          <Card title="Payment Details">
            {!selectedPatient ? (
              <p className="text-gray-500 text-center py-12">
                Select a patient to process payment
              </p>
            ) : !selectedRequest ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Select pending test request for payment:
                </p>
                {testRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No pending test requests for this patient
                  </p>
                ) : (
                  <div className="space-y-2">
                    {testRequests.map((request) => {
                      const total = request.tests.reduce(
                        (sum, test) => sum + test.price,
                        0
                      );
                      return (
                        <div
                          key={request.id}
                          onClick={() => setSelectedRequest(request)}
                          className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-primary"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {request.tests.length} Test(s)
                              </div>
                              <div className="text-sm text-gray-600">
                                {format(request.requestDate, 'dd MMM yyyy')}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                UGX {total.toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {request.paymentStatus}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Payment Summary
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Patient:</span>
                      <span className="font-medium">
                        {selectedPatient.patientId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tests:</span>
                      <span className="font-medium">
                        {selectedRequest.tests.length}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-200">
                      <span>Total:</span>
                      <span className="text-green-600">
                        UGX{' '}
                        {selectedRequest.tests
                          .reduce((sum, test) => sum + test.price, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Select
                  label="Payment Method"
                  value={paymentData.paymentMethod}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentMethod: e.target.value as typeof paymentData.paymentMethod,
                    })
                  }
                  options={[
                    { value: 'Cash', label: 'Cash' },
                    { value: 'Mobile Money', label: 'Mobile Money' },
                    { value: 'Card', label: 'Card' },
                    { value: 'Insurance', label: 'Insurance' },
                  ]}
                />

                {paymentData.paymentMethod === 'Mobile Money' && (
                  <>
                    <Select
                      label="Mobile Money Provider"
                      value={paymentData.mobileMoneyProvider}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          mobileMoneyProvider: e.target.value as 'MTN' | 'Airtel',
                        })
                      }
                      options={[
                        { value: 'MTN', label: 'MTN Mobile Money' },
                        { value: 'Airtel', label: 'Airtel Money' },
                      ]}
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={paymentData.mobileMoneyNumber}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          mobileMoneyNumber: e.target.value,
                        })
                      }
                      placeholder="+256 700 000 000"
                    />
                    <Input
                      label="Transaction ID"
                      type="text"
                      value={paymentData.transactionId}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          transactionId: e.target.value,
                        })
                      }
                      placeholder="Transaction reference"
                    />
                  </>
                )}

                <Input
                  label="Amount Paid (UGX)"
                  type="number"
                  required
                  value={paymentData.amountPaid}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      amountPaid: e.target.value,
                    })
                  }
                  placeholder="Enter amount"
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleProcessPayment}
                    disabled={submitting || !paymentData.amountPaid}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {submitting ? 'Processing...' : 'Process Payment'}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedPatient(null);
                      setSelectedRequest(null);
                    }}
                    className="bg-gray-500 hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
