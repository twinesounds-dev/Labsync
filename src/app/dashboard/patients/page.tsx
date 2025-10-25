'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Eye, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { formatDate, formatUgandaPhoneNumber, calculateAge } from '@/lib/utils';
import PatientForm from '@/components/patients/PatientForm';
import { Patient } from '@/lib/types';

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from the database
  useEffect(() => {
    const mockPatients: Patient[] = [
      {
        id: '1',
        patientId: 'FLNT-00123',
        facilityId: 'flnt',
        registrationDate: new Date('2024-12-20'),
        surname: 'Doe',
        givenName: 'John',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'Male',
        maritalStatus: 'Married',
        phoneNumber: '+256 700 123 456',
        email: 'john.doe@email.com',
        address: {
          village: 'Kampala Central',
          parish: 'Nakasero',
          subCounty: 'Kampala Central',
          district: 'Kampala',
        },
        nationalID: 'CF123456789',
        referringDoctor: 'Dr. Smith',
        hospitalClinic: 'Kampala Hospital',
        clinicalHistory: 'Routine checkup',
        urgency: 'Routine',
        paymentType: 'Cash',
        isActive: true,
        createdAt: new Date('2024-12-20'),
        updatedAt: new Date('2024-12-20'),
      },
      {
        id: '2',
        patientId: 'FLNT-00124',
        facilityId: 'flnt',
        registrationDate: new Date('2024-12-21'),
        surname: 'Smith',
        givenName: 'Jane',
        dateOfBirth: new Date('1990-08-22'),
        gender: 'Female',
        maritalStatus: 'Single',
        phoneNumber: '+256 700 987 654',
        email: 'jane.smith@email.com',
        address: {
          village: 'Mbarara Town',
          parish: 'Kakoba',
          subCounty: 'Mbarara Municipality',
          district: 'Mbarara',
        },
        nationalID: 'CF987654321',
        referringDoctor: 'Dr. Johnson',
        hospitalClinic: 'Mbarara Hospital',
        clinicalHistory: 'Pregnancy test',
        urgency: 'Urgent',
        paymentType: 'Insurance',
        insuranceProvider: 'AAR Insurance',
        insuranceNumber: 'AAR123456',
        isActive: true,
        createdAt: new Date('2024-12-21'),
        updatedAt: new Date('2024-12-21'),
      },
    ];

    setPatients(mockPatients);
    setFilteredPatients(mockPatients);
    setLoading(false);
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      patient.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phoneNumber.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsFormOpen(true);
  };

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient);
    // In a real app, this would navigate to a patient details page
    console.log('View patient:', patient);
  };

  const handleDelete = (patientId: string) => {
    if (confirm('Are you sure you want to delete this patient?')) {
      setPatients(patients.filter(p => p.id !== patientId));
      setFilteredPatients(filteredPatients.filter(p => p.id !== patientId));
    }
  };

  const handleFormSubmit = (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedPatient) {
      // Update existing patient
      const updatedPatients = patients.map(p =>
        p.id === selectedPatient.id
          ? { ...p, ...patientData, updatedAt: new Date() }
          : p
      );
      setPatients(updatedPatients);
      setFilteredPatients(updatedPatients);
    } else {
      // Add new patient
      const newPatient: Patient = {
        ...patientData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setPatients([newPatient, ...patients]);
      setFilteredPatients([newPatient, ...filteredPatients]);
    }
    setIsFormOpen(false);
    setSelectedPatient(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-2">
            Manage patient registrations and information
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search patients by name, ID, or phone number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No patients found</p>
              <p className="text-gray-400 mt-2">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first patient'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.givenName} {patient.surname}
                        </h3>
                        <p className="text-sm text-gray-500">ID: {patient.patientId}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {patient.gender}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {calculateAge(patient.dateOfBirth)} years
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {patient.urgency}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{formatUgandaPhoneNumber(patient.phoneNumber)}</span>
                      </div>
                      {patient.email && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>{patient.email}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{patient.address.district}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Registered: {formatDate(patient.registrationDate)}</p>
                      <p>Payment: {patient.paymentType}</p>
                      {patient.referringDoctor && (
                        <p>Referred by: {patient.referringDoctor}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(patient)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(patient)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(patient.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Patient Form Modal */}
      {isFormOpen && (
        <PatientForm
          patient={selectedPatient}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedPatient(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}