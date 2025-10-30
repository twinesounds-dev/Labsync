'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { TestRequest, Payment, Patient } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function NewPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const requestId = searchParams.get('requestId');

  const [testRequest, setTestRequest] = useState<TestRequest | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    paymentMethod: 'Cash',
    mobileMoneyProvider: 'MTN',
    mobileMoneyNumber: '',
    transactionId: '',
    amountPaid: 0,
    discount: 0,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const loadData = async () => {
    try {
      if (!requestId) {
        throw new Error('No test request ID provided');
      }

      const requestData = await firestoreService.getById<TestRequest>(
        COLLECTIONS.TEST_REQUESTS,
        requestId
      );
      setTestRequest(requestData);

      if (requestData?.patientId) {
        const patientData = await firestoreService.getById<Patient>(
          COLLECTIONS.PATIENTS,
          requestData.patientId
        );
        setPatient(patientData);
      }

      // Set default amount to total
      if (requestData) {
        const total = requestData.tests.reduce(
          (sum, test) => sum + test.price,
          0
        );
        setFormData((prev) => ({ ...prev, amountPaid: total }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value =
      e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!userProfile || !testRequest || !patient) {
        throw new Error('Missing required data');
      }

      const subtotal = testRequest.tests.reduce(
        (sum, test) => sum + test.price,
        0
      );
      const total = subtotal - formData.discount;
      const balance = total - formData.amountPaid;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}`;

      const paymentData: Partial<Payment> = {
        patientId: testRequest.patientId,
        testRequestId: requestId!,
        facilityId: userProfile.facilityId,
        invoiceNumber,
        subtotal,
        discount: formData.discount,
        tax: 0,
        total,
        amountPaid: formData.amountPaid,
        balance,
        paymentMethod: formData.paymentMethod as 'Cash' | 'Mobile Money' | 'Card' | 'Insurance',
        mobileMoneyProvider:
          formData.paymentMethod === 'Mobile Money'
            ? (formData.mobileMoneyProvider as 'MTN' | 'Airtel')
            : undefined,
        mobileMoneyNumber:
          formData.paymentMethod === 'Mobile Money'
            ? formData.mobileMoneyNumber
            : undefined,
        transactionId: formData.transactionId || undefined,
        paymentDate: new Date(),
        receivedBy: userProfile.id,
        status: balance === 0 ? 'Paid' : balance < total ? 'Partial' : 'Pending',
      };

      await firestoreService.create<Payment>(COLLECTIONS.PAYMENTS, paymentData);

      // Update test request payment status and enable sample collection
      const paymentStatus = balance === 0 ? 'Paid' : balance < total ? 'Partial' : 'Pending';
      const updateData: Partial<TestRequest> = {
        paymentStatus: paymentStatus,
      };

      // PAYMENT GATE: If fully paid, make ready for sample collection
      if (balance === 0) {
        updateData.sampleCollectionStatus = 'READY_FOR_COLLECTION';
        updateData.paymentCompletedAt = new Date();
        updateData.overallStatus = 'ReadyForCollection';
      }

      await firestoreService.update<TestRequest>(
        COLLECTIONS.TEST_REQUESTS,
        requestId!,
        updateData as Partial<TestRequest>
      );

      // Print receipt and redirect
      if (balance === 0) {
        alert(
          `Payment recorded successfully!\nInvoice: ${invoiceNumber}\n\n✅ Patient is now ready for sample collection.\nPlease direct patient to the Clerk for sample collection.`
        );
      } else {
        alert(
          `Payment recorded successfully!\nInvoice: ${invoiceNumber}\n\n⚠️ Balance remaining: UGX ${balance.toLocaleString()}\nComplete payment before sample collection.`
        );
      }
      router.push('/dashboard/reception');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const subtotal = testRequest?.tests.reduce((sum, test) => sum + test.price, 0) || 0;
  const total = subtotal - formData.discount;
  const balance = total - formData.amountPaid;

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard/reception">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Process Payment</h1>
              {patient && (
                <p className="text-gray-600 mt-1">
                  Patient: {patient.givenName} {patient.surname} ({patient.patientId})
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card title="Payment Details">
                <div className="space-y-4">
                  <Select
                    label="Payment Method"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    options={[
                      { value: 'Cash', label: 'Cash' },
                      { value: 'Mobile Money', label: 'Mobile Money' },
                      { value: 'Card', label: 'Card' },
                      { value: 'Insurance', label: 'Insurance' },
                    ]}
                    required
                  />

                  {formData.paymentMethod === 'Mobile Money' && (
                    <>
                      <Select
                        label="Mobile Money Provider"
                        name="mobileMoneyProvider"
                        value={formData.mobileMoneyProvider}
                        onChange={handleChange}
                        options={[
                          { value: 'MTN', label: 'MTN Mobile Money' },
                          { value: 'Airtel', label: 'Airtel Money' },
                        ]}
                        required
                      />
                      <Input
                        label="Mobile Money Number"
                        name="mobileMoneyNumber"
                        value={formData.mobileMoneyNumber}
                        onChange={handleChange}
                        placeholder="+256 700 000 000"
                        required
                      />
                    </>
                  )}

                  <Input
                    label="Transaction ID (Optional)"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleChange}
                  />

                  <Input
                    label="Discount (UGX)"
                    name="discount"
                    type="number"
                    value={formData.discount}
                    onChange={handleChange}
                    min={0}
                    max={subtotal}
                  />

                  <Input
                    label="Amount Paid (UGX)"
                    name="amountPaid"
                    type="number"
                    value={formData.amountPaid}
                    onChange={handleChange}
                    min={0}
                    required
                  />

                  <div className="flex justify-end space-x-4 pt-4">
                    <Link href="/dashboard/reception">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" isLoading={submitting}>
                      Process Payment & Print Receipt
                    </Button>
                  </div>
                </div>
              </Card>
            </form>
          </div>

          {/* Payment Summary */}
          <div>
            <Card title="Payment Summary" className="sticky top-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    Tests Requested
                  </h4>
                  <div className="space-y-2">
                    {testRequest?.tests.map((test, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-sm p-2 bg-gray-50 rounded"
                      >
                        <span className="text-gray-600">Test {index + 1}</span>
                        <span className="font-medium">
                          UGX {test.price.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      UGX {subtotal.toLocaleString()}
                    </span>
                  </div>
                  {formData.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-medium text-red-600">
                        - UGX {formData.discount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-primary">
                      UGX {total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">
                      UGX {formData.amountPaid.toLocaleString()}
                    </span>
                  </div>
                  {balance > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-medium text-orange-600">
                        UGX {balance.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {balance < 0 && (
                  <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
                    ⚠️ Change to give: UGX {Math.abs(balance).toLocaleString()}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <NewPaymentContent />
    </Suspense>
  );
}
