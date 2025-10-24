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
import { X } from 'lucide-react';
import { Patient } from '@/lib/types';

const patientSchema = z.object({
  surname: z.string().min(1, 'Surname is required'),
  givenName: z.string().min(1, 'Given name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female']),
  maritalStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed']),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.object({
    village: z.string().min(1, 'Village is required'),
    parish: z.string().min(1, 'Parish is required'),
    subCounty: z.string().min(1, 'Sub-county is required'),
    district: z.string().min(1, 'District is required'),
  }),
  nationalID: z.string().optional(),
  passportNumber: z.string().optional(),
  NIN: z.string().optional(),
  referringDoctor: z.string().optional(),
  hospitalClinic: z.string().optional(),
  clinicalHistory: z.string().optional(),
  urgency: z.enum(['Routine', 'Urgent', 'STAT']),
  paymentType: z.enum(['Cash', 'Insurance', 'Corporate']),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  corporateClient: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  patient?: Patient | null;
  onClose: () => void;
  onSubmit: (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export default function PatientForm({ patient, onClose, onSubmit }: PatientFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? {
      surname: patient.surname,
      givenName: patient.givenName,
      dateOfBirth: patient.dateOfBirth.toISOString().split('T')[0],
      gender: patient.gender,
      maritalStatus: patient.maritalStatus,
      phoneNumber: patient.phoneNumber,
      email: patient.email || '',
      address: patient.address,
      nationalID: patient.nationalID || '',
      passportNumber: patient.passportNumber || '',
      NIN: patient.NIN || '',
      referringDoctor: patient.referringDoctor || '',
      hospitalClinic: patient.hospitalClinic || '',
      clinicalHistory: patient.clinicalHistory || '',
      urgency: patient.urgency,
      paymentType: patient.paymentType,
      insuranceProvider: patient.insuranceProvider || '',
      insuranceNumber: patient.insuranceNumber || '',
      corporateClient: patient.corporateClient || '',
    } : {
      surname: '',
      givenName: '',
      dateOfBirth: '',
      gender: 'Male',
      maritalStatus: 'Single',
      phoneNumber: '',
      email: '',
      address: {
        village: '',
        parish: '',
        subCounty: '',
        district: '',
      },
      nationalID: '',
      passportNumber: '',
      NIN: '',
      referringDoctor: '',
      hospitalClinic: '',
      clinicalHistory: '',
      urgency: 'Routine',
      paymentType: 'Cash',
      insuranceProvider: '',
      insuranceNumber: '',
      corporateClient: '',
    },
  });

  const paymentType = watch('paymentType');

  const generatePatientId = () => {
    const facilityCode = user?.facilityId === 'flnt' ? 'FLNT' : 
                        user?.facilityId === 'flmb' ? 'FLMB' : 'PMC';
    const randomNumber = Math.floor(Math.random() * 1000) + 1;
    return `${facilityCode}-${randomNumber.toString().padStart(5, '0')}`;
  };

  const onFormSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true);
    try {
      const patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
        patientId: patient?.patientId || generatePatientId(),
        facilityId: user?.facilityId || '',
        registrationDate: new Date(),
        surname: data.surname,
        givenName: data.givenName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        maritalStatus: data.maritalStatus,
        phoneNumber: data.phoneNumber,
        email: data.email || undefined,
        address: data.address,
        nationalID: data.nationalID || undefined,
        passportNumber: data.passportNumber || undefined,
        NIN: data.NIN || undefined,
        referringDoctor: data.referringDoctor || undefined,
        hospitalClinic: data.hospitalClinic || undefined,
        clinicalHistory: data.clinicalHistory || undefined,
        urgency: data.urgency,
        paymentType: data.paymentType,
        insuranceProvider: data.insuranceProvider || undefined,
        insuranceNumber: data.insuranceNumber || undefined,
        corporateClient: data.corporateClient || undefined,
        isActive: true,
      };

      onSubmit(patientData);
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
            <CardTitle>{patient ? 'Edit Patient' : 'Add New Patient'}</CardTitle>
            <CardDescription>
              {patient ? 'Update patient information' : 'Register a new patient in the system'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    {...register('surname')}
                    className={errors.surname ? 'border-red-500' : ''}
                  />
                  {errors.surname && (
                    <p className="text-sm text-red-500">{errors.surname.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="givenName">Given Name *</Label>
                  <Input
                    id="givenName"
                    {...register('givenName')}
                    className={errors.givenName ? 'border-red-500' : ''}
                  />
                  {errors.givenName && (
                    <p className="text-sm text-red-500">{errors.givenName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    className={errors.dateOfBirth ? 'border-red-500' : ''}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <select
                    id="gender"
                    {...register('gender')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status *</Label>
                  <select
                    id="maritalStatus"
                    {...register('maritalStatus')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+256 XXX XXX XXX"
                    {...register('phoneNumber')}
                    className={errors.phoneNumber ? 'border-red-500' : ''}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="patient@email.com"
                    {...register('email')}
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="village">Village *</Label>
                  <Input
                    id="village"
                    {...register('address.village')}
                    className={errors.address?.village ? 'border-red-500' : ''}
                  />
                  {errors.address?.village && (
                    <p className="text-sm text-red-500">{errors.address.village.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parish">Parish *</Label>
                  <Input
                    id="parish"
                    {...register('address.parish')}
                    className={errors.address?.parish ? 'border-red-500' : ''}
                  />
                  {errors.address?.parish && (
                    <p className="text-sm text-red-500">{errors.address.parish.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subCounty">Sub-county *</Label>
                  <Input
                    id="subCounty"
                    {...register('address.subCounty')}
                    className={errors.address?.subCounty ? 'border-red-500' : ''}
                  />
                  {errors.address?.subCounty && (
                    <p className="text-sm text-red-500">{errors.address.subCounty.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    {...register('address.district')}
                    className={errors.address?.district ? 'border-red-500' : ''}
                  />
                  {errors.address?.district && (
                    <p className="text-sm text-red-500">{errors.address.district.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Identification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationalID">National ID</Label>
                  <Input
                    id="nationalID"
                    placeholder="CF123456789"
                    {...register('nationalID')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    placeholder="B1234567"
                    {...register('passportNumber')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="NIN">NIN</Label>
                  <Input
                    id="NIN"
                    placeholder="1234567890123"
                    {...register('NIN')}
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2 md:col-span-2">
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
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentType">Payment Type *</Label>
                  <select
                    id="paymentType"
                    {...register('paymentType')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                {paymentType === 'Insurance' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                      <Input
                        id="insuranceProvider"
                        placeholder="AAR Insurance"
                        {...register('insuranceProvider')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceNumber">Insurance Number</Label>
                      <Input
                        id="insuranceNumber"
                        placeholder="AAR123456"
                        {...register('insuranceNumber')}
                      />
                    </div>
                  </>
                )}
                {paymentType === 'Corporate' && (
                  <div className="space-y-2">
                    <Label htmlFor="corporateClient">Corporate Client</Label>
                    <Input
                      id="corporateClient"
                      placeholder="ABC Company Ltd"
                      {...register('corporateClient')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : patient ? 'Update Patient' : 'Add Patient'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}