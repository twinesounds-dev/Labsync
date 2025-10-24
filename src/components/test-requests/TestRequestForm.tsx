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
import { X, Plus, Trash2, Search } from 'lucide-react';
import { TestRequest, Patient, Test } from '@/lib/types';
import { testCategories, tests } from '@/lib/testData';
import { formatCurrency } from '@/lib/utils';

const testRequestSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  tests: z.array(z.object({
    testId: z.string(),
    priority: z.number().min(1).max(10),
  })).min(1, 'At least one test is required'),
  urgency: z.enum(['Routine', 'Urgent', 'STAT']),
  referringDoctor: z.string().optional(),
  hospitalClinic: z.string().optional(),
  clinicalHistory: z.string().optional(),
  specialInstructions: z.string().optional(),
  clerkNotes: z.string().optional(),
});

type TestRequestFormData = z.infer<typeof testRequestSchema>;

interface TestRequestFormProps {
  request?: TestRequest | null;
  onClose: () => void;
  onSubmit: (data: Omit<TestRequest, 'id' | 'requestedAt'>) => void;
}

export default function TestRequestForm({ request, onClose, onSubmit }: TestRequestFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTests, setSelectedTests] = useState<{ testId: string; priority: number; test?: Test }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableTests, setAvailableTests] = useState<Test[]>(tests);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestRequestFormData>({
    resolver: zodResolver(testRequestSchema),
    defaultValues: request ? {
      patientId: request.patientId,
      tests: request.tests.map(t => ({ testId: t.testId, priority: t.priority })),
      urgency: request.urgency,
      referringDoctor: request.referringDoctor || '',
      hospitalClinic: request.hospitalClinic || '',
      clinicalHistory: request.clinicalHistory || '',
      specialInstructions: request.specialInstructions || '',
      clerkNotes: request.clerkNotes || '',
    } : {
      patientId: '',
      tests: [],
      urgency: 'Routine',
      referringDoctor: '',
      hospitalClinic: '',
      clinicalHistory: '',
      specialInstructions: '',
      clerkNotes: '',
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

  useEffect(() => {
    if (request) {
      const testsWithDetails = request.tests.map(t => ({
        testId: t.testId,
        priority: t.priority,
        test: t.test,
      }));
      setSelectedTests(testsWithDetails);
    }
  }, [request]);

  useEffect(() => {
    let filtered = tests;

    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(test => test.categoryId === selectedCategory);
    }

    setAvailableTests(filtered);
  }, [searchTerm, selectedCategory]);

  const addTest = (test: Test) => {
    if (!selectedTests.find(t => t.testId === test.id)) {
      const newTest = {
        testId: test.id,
        priority: selectedTests.length + 1,
        test: test,
      };
      setSelectedTests([...selectedTests, newTest]);
      setValue('tests', [...selectedTests, newTest].map(t => ({ testId: t.testId, priority: t.priority })));
    }
  };

  const removeTest = (testId: string) => {
    const updatedTests = selectedTests.filter(t => t.testId !== testId);
    setSelectedTests(updatedTests);
    setValue('tests', updatedTests.map(t => ({ testId: t.testId, priority: t.priority })));
  };

  const updatePriority = (testId: string, priority: number) => {
    const updatedTests = selectedTests.map(t =>
      t.testId === testId ? { ...t, priority } : t
    );
    setSelectedTests(updatedTests);
    setValue('tests', updatedTests.map(t => ({ testId: t.testId, priority: t.priority })));
  };

  const onFormSubmit = async (data: TestRequestFormData) => {
    setIsSubmitting(true);
    try {
      const requestData: Omit<TestRequest, 'id' | 'requestedAt'> = {
        patientId: data.patientId,
        facilityId: user?.facilityId || '',
        tests: data.tests.map(t => ({
          testId: t.testId,
          test: selectedTests.find(st => st.testId === t.testId)?.test,
          status: 'Pending',
          priority: t.priority,
        })),
        urgency: data.urgency,
        referringDoctor: data.referringDoctor || undefined,
        hospitalClinic: data.hospitalClinic || undefined,
        clinicalHistory: data.clinicalHistory || undefined,
        specialInstructions: data.specialInstructions || undefined,
        status: 'Pending',
        requestedBy: user?.id || '',
        clerkNotes: data.clerkNotes || undefined,
      };

      onSubmit(requestData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = selectedTests.reduce((sum, test) => sum + (test.test?.price || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{request ? 'Edit Test Request' : 'New Test Request'}</CardTitle>
            <CardDescription>
              {request ? 'Update test request information' : 'Create a new laboratory test request'}
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
              
              {/* Search and Filter */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Categories</option>
                  {testCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Available Tests */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto border rounded-md p-4">
                {availableTests.map((test) => (
                  <div
                    key={test.id}
                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => addTest(test)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{test.name}</h4>
                        <p className="text-xs text-gray-500">{test.code}</p>
                        <p className="text-xs text-gray-500">{test.sampleType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(test.price)}</p>
                        <p className="text-xs text-gray-500">{test.turnaroundTime}</p>
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
                    {selectedTests.map((testItem, index) => (
                      <div key={testItem.testId} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{testItem.test?.name}</h4>
                          <p className="text-xs text-gray-500">{testItem.test?.code} - {formatCurrency(testItem.test?.price || 0)}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label className="text-xs">Priority:</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={testItem.priority}
                            onChange={(e) => updatePriority(testItem.testId, parseInt(e.target.value))}
                            className="w-16 h-8"
                          />
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
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      Total: {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              )}
              {errors.tests && (
                <p className="text-sm text-red-500">{errors.tests.message}</p>
              )}
            </div>

            {/* Request Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Request Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency *</Label>
                  <select
                    id="urgency"
                    {...register('urgency')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="STAT">STAT</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referringDoctor">Referring Doctor</Label>
                  <Input
                    id="referringDoctor"
                    placeholder="Dr. Smith"
                    {...register('referringDoctor')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalClinic">Hospital/Clinic</Label>
                  <Input
                    id="hospitalClinic"
                    placeholder="Kampala Hospital"
                    {...register('hospitalClinic')}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinicalHistory">Clinical History</Label>
                <textarea
                  id="clinicalHistory"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Brief clinical history..."
                  {...register('clinicalHistory')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Special Instructions</Label>
                <textarea
                  id="specialInstructions"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Any special instructions for sample collection or processing..."
                  {...register('specialInstructions')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clerkNotes">Clerk Notes</Label>
                <textarea
                  id="clerkNotes"
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Additional notes from the clerk..."
                  {...register('clerkNotes')}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || selectedTests.length === 0}>
                {isSubmitting ? 'Saving...' : request ? 'Update Request' : 'Create Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}