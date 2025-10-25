'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
import { Payment, Patient, Test } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

const paymentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  tests: z.array(z.object({
    testId: z.string(),
    name: z.string(),
    price: z.number().min(0),
  })).min(1, 'At least one test is required'),
  subtotal: z.number().min(0),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  total: z.number().min(0),
  amountPaid: z.number().min(0),
  balance: z.number(),
  paymentMethod: z.enum(['Cash', 'Mobile Money', 'Card', 'Insurance']),
  mobileMoneyNumber: z.string().optional(),
  mobileMoneyProvider: z.enum(['MTN', 'Airtel']).optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  payment?: Payment | null;
  onClose: () => void;
  onSubmit: (data: Omit<Payment, 'id' | 'paymentDate'>) => void;
}

export default function PaymentForm({ payment, onClose, onSubmit }: PaymentFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTests, setSelectedTests] = useState<{ testId: string; name: string; price: number; test?: Test }[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment ? {
      patientId: payment.patientId,
      tests: payment.tests.map(t => ({ testId: t.testId, name: t.name, price: t.price })),
      subtotal: payment.subtotal,
      discount: payment.discount || 0,
      tax: payment.tax || 0,
      total: payment.total,
      amountPaid: payment.amountPaid,
      balance: payment.balance,
      paymentMethod: payment.paymentMethod,
      mobileMoneyNumber: payment.mobileMoneyNumber || '',
      mobileMoneyProvider: payment.mobileMoneyProvider || 'MTN',
      transactionId: payment.transactionId || '',
      notes: payment.notes || '',
    } : {
      patientId: '',
      tests: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      amountPaid: 0,
      balance: 0,
      paymentMethod: 'Cash',
      mobileMoneyNumber: '',
      mobileMoneyProvider: 'MTN',
      transactionId: '',
      notes: '',
    },
  });

  // Mock patients - in a real app, this would come from the database
  const mockPatients: Patient[] = [
    {
      id: '1',
      patientId: 'FLNT-00123',
      surname: 'Doe',
      givenName: 'John',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'Male',
      maritalStatus: 'Married',
      phoneNumber: '+256 700 123 456',
      facilityId: 'flnt',
      registrationDate: new Date('2024-12-20'),
      address: {
        village: 'Kampala Central',
        parish: 'Nakasero',
        subCounty: 'Kampala Central',
        district: 'Kampala',
      },
      urgency: 'Routine',
      paymentType: 'Cash',
      isActive: true,
      createdAt: new Date('2024-12-20'),
      updatedAt: new Date('2024-12-20'),
    },
    {
      id: '2',
      patientId: 'FLNT-00124',
      surname: 'Smith',
      givenName: 'Jane',
      dateOfBirth: new Date('1990-08-22'),
      gender: 'Female',
      maritalStatus: 'Single',
      phoneNumber: '+256 700 987 654',
      facilityId: 'flnt',
      registrationDate: new Date('2024-12-21'),
      address: {
        village: 'Mbarara Town',
        parish: 'Kakoba',
        subCounty: 'Mbarara Municipality',
        district: 'Mbarara',
      },
      urgency: 'Urgent',
      paymentType: 'Insurance',
      insuranceProvider: 'AAR Insurance',
      insuranceNumber: 'AAR123456',
      isActive: true,
      createdAt: new Date('2024-12-21'),
      updatedAt: new Date('2024-12-21'),
    },
  ];

  // Mock tests - in a real app, this would come from the database
  const mockTests: Test[] = [
    {
      id: 'fbc',
      categoryId: 'hematology',
      name: 'Full Hemogram',
      code: 'FBC',
      price: 15000,
      turnaroundTime: '2 hours',
      sampleType: 'Blood',
      normalRanges: [],
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'mp',
      categoryId: 'hematology',
      name: 'Malaria Parasite Test',
      code: 'MP',
      price: 5000,
      turnaroundTime: '30 mins',
      sampleType: 'Blood',
      normalRanges: [],
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'bhcg',
      categoryId: 'hormones',
      name: 'Beta HCG',
      code: 'BHCG',
      price: 25000,
      turnaroundTime: '2 hours',
      sampleType: 'Blood',
      normalRanges: [],
      isActive: true,
      createdAt: new Date(),
    },
  ];

  const paymentMethod = watch('paymentMethod');
  const subtotal = watch('subtotal');
  const discount = watch('discount') || 0;
  const tax = watch('tax') || 0;
  const amountPaid = watch('amountPaid');

  useEffect(() => {
    if (payment) {
      const testsWithDetails = payment.tests.map(t => ({
        testId: t.testId,
        name: t.name,
        price: t.price,
        test: t.test,
      }));
      setSelectedTests(testsWithDetails);
    }
  }, [payment]);

  useEffect(() => {
    const newTotal = subtotal - discount + tax;
    const newBalance = newTotal - amountPaid;
    setValue('total', newTotal);
    setValue('balance', newBalance);
  }, [subtotal, discount, tax, amountPaid, setValue]);

  const addTest = (test: Test) => {
    if (!selectedTests.find(t => t.testId === test.id)) {
      const newTest = {
        testId: test.id,
        name: test.name,
        price: test.price,
        test: test,
      };
      const updatedTests = [...selectedTests, newTest];
      setSelectedTests(updatedTests);
      setValue('tests', updatedTests.map(t => ({ testId: t.testId, name: t.name, price: t.price })));
      
      const newSubtotal = updatedTests.reduce((sum, t) => sum + t.price, 0);
      setValue('subtotal', newSubtotal);
    }
  };

  const removeTest = (testId: string) => {
    const updatedTests = selectedTests.filter(t => t.testId !== testId);
    setSelectedTests(updatedTests);
    setValue('tests', updatedTests.map(t => ({ testId: t.testId, name: t.name, price: t.price })));
    
    const newSubtotal = updatedTests.reduce((sum, t) => sum + t.price, 0);
    setValue('subtotal', newSubtotal);
  };

  const generateInvoiceNumber = () => {
    const facilityCode = user?.facilityId === 'flnt' ? 'FLNT' : 
                        user?.facilityId === 'flmb' ? 'FLMB' : 'PMC';
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${facilityCode}-${year}${month}${day}-${random}`;
  };

  const onFormSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      const paymentData: Omit<Payment, 'id' | 'paymentDate'> = {
        patientId: data.patientId,
        facilityId: user?.facilityId || '',
        invoiceNumber: payment?.invoiceNumber || generateInvoiceNumber(),
        tests: data.tests.map(t => ({
          testId: t.testId,
          test: selectedTests.find(st => st.testId === t.testId)?.test,
          name: t.name,
          price: t.price,
        })),
        subtotal: data.subtotal,
        discount: data.discount || 0,
        tax: data.tax || 0,
        total: data.total,
        amountPaid: data.amountPaid,
        balance: data.balance,
        paymentMethod: data.paymentMethod,
        mobileMoneyNumber: data.mobileMoneyNumber || undefined,
        mobileMoneyProvider: data.mobileMoneyProvider || undefined,
        transactionId: data.transactionId || undefined,
        receivedBy: user?.id || '',
        receivedByUser: user,
        status: data.balance === 0 ? 'Paid' : data.amountPaid > 0 ? 'Partial' : 'Pending',
        notes: data.notes || undefined,
      };

      onSubmit(paymentData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{payment ? 'Edit Payment' : 'New Payment'}</CardTitle>
            <CardDescription>
              {payment ? 'Update payment information' : 'Record a new payment transaction'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Patient Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Patient Information</h3>
              <div className="space-y-2">
                <Label htmlFor="patientId">Select Patient *</Label>
                <select
                  id="patientId"
                  {...register('patientId')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a patient...</option>
                  {mockPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.givenName} {patient.surname} ({patient.patientId})
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="text-sm text-red-500">{errors.patientId.message}</p>
                )}
              </div>
            </div>

            {/* Test Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Selection</h3>
              
              {/* Available Tests */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-48 overflow-y-auto border rounded-md p-4">
                {mockTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => addTest(test)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{test.name}</h4>
                        <p className="text-xs text-gray-500">{test.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(test.price)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Tests */}
              {selectedTests.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Tests</Label>
                  <div className="space-y-2">
                    {selectedTests.map((testItem) => (
                      <div key={testItem.testId} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{testItem.name}</h4>
                          <p className="text-xs text-gray-500">{testItem.test?.code}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{formatCurrency(testItem.price)}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeTest(testItem.testId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {errors.tests && (
                <p className="text-sm text-red-500">{errors.tests.message}</p>
              )}
            </div>

            {/* Payment Calculation */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Calculation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    {...register('subtotal', { valueAsNumber: true })}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount</Label>
                  <Input
                    id="discount"
                    type="number"
                    {...register('discount', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    {...register('tax', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    type="number"
                    {...register('total', { valueAsNumber: true })}
                    readOnly
                    className="bg-gray-50 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amountPaid">Amount Paid *</Label>
                  <Input
                    id="amountPaid"
                    type="number"
                    {...register('amountPaid', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.amountPaid && (
                    <p className="text-sm text-red-500">{errors.amountPaid.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    {...register('balance', { valueAsNumber: true })}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <select
                    id="paymentMethod"
                    {...register('paymentMethod')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Card">Card</option>
                    <option value="Insurance">Insurance</option>
                  </select>
                </div>
              </div>

              {paymentMethod === 'Mobile Money' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobileMoneyProvider">Provider</Label>
                    <select
                      id="mobileMoneyProvider"
                      {...register('mobileMoneyProvider')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="Airtel">Airtel Money</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobileMoneyNumber">Mobile Money Number</Label>
                    <Input
                      id="mobileMoneyNumber"
                      placeholder="+256 XXX XXX XXX"
                      {...register('mobileMoneyNumber')}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  placeholder="Enter transaction reference"
                  {...register('transactionId')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Additional payment notes..."
                  {...register('notes')}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || selectedTests.length === 0}>
                {isSubmitting ? 'Saving...' : payment ? 'Update Payment' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}