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
import { X, Plus, Trash2 } from 'lucide-react';
import { TestResult, Test, ResultValue, QualityControl } from '@/lib/types';

const testResultSchema = z.object({
  testRequestId: z.string().min(1, 'Test request is required'),
  testId: z.string().min(1, 'Test is required'),
  patientId: z.string().min(1, 'Patient is required'),
  resultValues: z.array(z.object({
    parameter: z.string().min(1, 'Parameter is required'),
    value: z.union([z.string(), z.number()]),
    unit: z.string().min(1, 'Unit is required'),
    normalRange: z.string().min(1, 'Normal range is required'),
    flag: z.enum(['Normal', 'Low', 'High', 'Critical']),
    isAbnormal: z.boolean(),
  })).min(1, 'At least one result value is required'),
  remarks: z.string().optional(),
  qualityControl: z.object({
    controlSample: z.string().optional(),
    controlValue: z.string().optional(),
    isPassed: z.boolean(),
    notes: z.string().optional(),
  }).optional(),
});

type TestResultFormData = z.infer<typeof testResultSchema>;

interface TestResultFormProps {
  result?: TestResult | null;
  onClose: () => void;
  onSubmit: (data: Omit<TestResult, 'id' | 'datePerformed'>) => void;
}

export default function TestResultForm({ result, onClose, onSubmit }: TestResultFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultValues, setResultValues] = useState<ResultValue[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TestResultFormData>({
    resolver: zodResolver(testResultSchema),
    defaultValues: result ? {
      testRequestId: result.testRequestId,
      testId: result.testId,
      patientId: result.patientId,
      resultValues: result.resultValues,
      remarks: result.remarks || '',
      qualityControl: result.qualityControl || {
        controlSample: '',
        controlValue: '',
        isPassed: true,
        notes: '',
      },
    } : {
      testRequestId: '',
      testId: '',
      patientId: '',
      resultValues: [],
      remarks: '',
      qualityControl: {
        controlSample: '',
        controlValue: '',
        isPassed: true,
        notes: '',
      },
    },
  });

  // Mock test - in a real app, this would come from the database
  const mockTest: Test = {
    id: 'fbc',
    categoryId: 'hematology',
    name: 'Full Hemogram',
    code: 'FBC',
    price: 15000,
    turnaroundTime: '2 hours',
    sampleType: 'Blood',
    normalRanges: [
      {
        id: 'hb-male',
        parameter: 'Hemoglobin',
        unit: 'g/dL',
        minValue: 13.0,
        maxValue: 17.0,
        gender: 'Male',
        flag: 'Normal',
      },
      {
        id: 'hb-female',
        parameter: 'Hemoglobin',
        unit: 'g/dL',
        minValue: 12.0,
        maxValue: 15.0,
        gender: 'Female',
        flag: 'Normal',
      },
      {
        id: 'wbc',
        parameter: 'White Blood Cell Count',
        unit: 'cells/μL',
        minValue: 4000,
        maxValue: 11000,
        gender: 'Both',
        flag: 'Normal',
      },
      {
        id: 'platelets',
        parameter: 'Platelet Count',
        unit: 'thousand/μL',
        minValue: 150,
        maxValue: 450,
        gender: 'Both',
        flag: 'Normal',
      },
    ],
    isActive: true,
    createdAt: new Date(),
  };

  useEffect(() => {
    if (result) {
      setResultValues(result.resultValues);
    } else {
      // Initialize with test's normal ranges
      const initialValues = mockTest.normalRanges.map(range => ({
        parameter: range.parameter,
        value: '',
        unit: range.unit,
        normalRange: range.minValue && range.maxValue 
          ? `${range.minValue}-${range.maxValue}` 
          : range.normalValue || '',
        flag: 'Normal' as const,
        isAbnormal: false,
      }));
      setResultValues(initialValues);
      setValue('resultValues', initialValues);
    }
  }, [result, setValue]);

  const addResultValue = () => {
    const newValue: ResultValue = {
      parameter: '',
      value: '',
      unit: '',
      normalRange: '',
      flag: 'Normal',
      isAbnormal: false,
    };
    const updatedValues = [...resultValues, newValue];
    setResultValues(updatedValues);
    setValue('resultValues', updatedValues);
  };

  const removeResultValue = (index: number) => {
    const updatedValues = resultValues.filter((_, i) => i !== index);
    setResultValues(updatedValues);
    setValue('resultValues', updatedValues);
  };

  const updateResultValue = (index: number, field: keyof ResultValue, value: any) => {
    const updatedValues = [...resultValues];
    updatedValues[index] = { ...updatedValues[index], [field]: value };
    
    // Auto-determine flag based on value and normal range
    if (field === 'value' && typeof value === 'number') {
      const normalRange = updatedValues[index].normalRange;
      if (normalRange.includes('-')) {
        const [min, max] = normalRange.split('-').map(Number);
        if (value < min) {
          updatedValues[index].flag = 'Low';
          updatedValues[index].isAbnormal = true;
        } else if (value > max) {
          updatedValues[index].flag = 'High';
          updatedValues[index].isAbnormal = true;
        } else {
          updatedValues[index].flag = 'Normal';
          updatedValues[index].isAbnormal = false;
        }
      }
    }
    
    setResultValues(updatedValues);
    setValue('resultValues', updatedValues);
  };

  const onFormSubmit = async (data: TestResultFormData) => {
    setIsSubmitting(true);
    try {
      const resultData: Omit<TestResult, 'id' | 'datePerformed'> = {
        testRequestId: data.testRequestId,
        testId: data.testId,
        patientId: data.patientId,
        technicianId: user?.id || '',
        resultValues: data.resultValues,
        remarks: data.remarks || undefined,
        dateApproved: undefined,
        approvedBy: undefined,
        status: 'Completed',
        qualityControl: data.qualityControl || undefined,
      };

      onSubmit(resultData);
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
            <CardTitle>{result ? 'Edit Test Result' : 'New Test Result'}</CardTitle>
            <CardDescription>
              {result ? 'Update test result information' : 'Enter laboratory test results'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Test Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Test Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Test Name</Label>
                  <Input value={mockTest.name} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Test Code</Label>
                  <Input value={mockTest.code} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Sample Type</Label>
                  <Input value={mockTest.sampleType} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>Turnaround Time</Label>
                  <Input value={mockTest.turnaroundTime} readOnly className="bg-gray-50" />
                </div>
              </div>
            </div>

            {/* Result Values */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Result Values</h3>
                <Button type="button" onClick={addResultValue} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Parameter
                </Button>
              </div>
              
              <div className="space-y-4">
                {resultValues.map((value, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <Label>Parameter</Label>
                        <Input
                          value={value.parameter}
                          onChange={(e) => updateResultValue(index, 'parameter', e.target.value)}
                          placeholder="e.g., Hemoglobin"
                        />
                      </div>
                      <div>
                        <Label>Value</Label>
                        <Input
                          type="number"
                          value={value.value}
                          onChange={(e) => updateResultValue(index, 'value', parseFloat(e.target.value) || '')}
                          placeholder="e.g., 14.5"
                        />
                      </div>
                      <div>
                        <Label>Unit</Label>
                        <Input
                          value={value.unit}
                          onChange={(e) => updateResultValue(index, 'unit', e.target.value)}
                          placeholder="e.g., g/dL"
                        />
                      </div>
                      <div>
                        <Label>Normal Range</Label>
                        <Input
                          value={value.normalRange}
                          onChange={(e) => updateResultValue(index, 'normalRange', e.target.value)}
                          placeholder="e.g., 13.0-17.0"
                        />
                      </div>
                      <div>
                        <Label>Flag</Label>
                        <select
                          value={value.flag}
                          onChange={(e) => updateResultValue(index, 'flag', e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Low">Low</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeResultValue(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.resultValues && (
                <p className="text-sm text-red-500">{errors.resultValues.message}</p>
              )}
            </div>

            {/* Quality Control */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quality Control</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="controlSample">Control Sample</Label>
                  <Input
                    id="controlSample"
                    {...register('qualityControl.controlSample')}
                    placeholder="e.g., Normal Control"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="controlValue">Control Value</Label>
                  <Input
                    id="controlValue"
                    {...register('qualityControl.controlValue')}
                    placeholder="e.g., Within Range"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isPassed">QC Status</Label>
                  <select
                    id="isPassed"
                    {...register('qualityControl.isPassed', { valueAsBoolean: true })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="true">Passed</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qcNotes">QC Notes</Label>
                  <Input
                    id="qcNotes"
                    {...register('qualityControl.notes')}
                    placeholder="Additional QC notes..."
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <textarea
                  id="remarks"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Additional remarks or comments..."
                  {...register('remarks')}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || resultValues.length === 0}>
                {isSubmitting ? 'Saving...' : result ? 'Update Result' : 'Save Result'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}