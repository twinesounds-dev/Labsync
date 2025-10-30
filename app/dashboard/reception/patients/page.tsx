'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Users, Plus, Search, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { Patient } from '@/types';
import { format } from 'date-fns';

export default function PatientsListPage() {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    const patientsQuery = query(
      collection(db, COLLECTIONS.PATIENTS),
      where('facilityId', '==', userProfile.facilityId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(patientsQuery, (snapshot) => {
      const patientsData = snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          ...data,
          registrationDate: data.registrationDate?.toDate?.() || new Date(),
          dateOfBirth: data.dateOfBirth?.toDate?.() || new Date(),
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      }) as Patient[];

      setPatients(patientsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.givenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phoneNumber?.includes(searchTerm)
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading patients...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-1">View and manage patient records</p>
          </div>
          <Link href="/dashboard/reception/patients/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Register New Patient
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by patient ID, name, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-none focus:ring-0"
            />
          </div>
        </Card>

        {/* Patients List */}
        <Card>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No patients found' : 'No patients registered yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Register your first patient to get started'}
              </p>
              {!searchTerm && (
                <Link href="/dashboard/reception/patients/new">
                  <Button>Register New Patient</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Patient ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Gender
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Phone
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Registration Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-primary">
                        {patient.patientId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {patient.surname} {patient.givenName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{patient.gender}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {patient.phoneNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {format(patient.registrationDate, 'dd MMM yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link href={`/dashboard/reception/patients/${patient.id}`}>
                            <button
                              className="text-primary hover:text-primary-dark p-1"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/dashboard/reception/patients/${patient.id}/tests`}>
                            <button
                              className="text-green-600 hover:text-green-800 p-1"
                              title="View Tests"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
