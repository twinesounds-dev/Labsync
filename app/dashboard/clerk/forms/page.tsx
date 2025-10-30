'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { FileText, Search, Eye } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { Patient } from '@/types';
import { format } from 'date-fns';
import Link from 'next/link';

export default function RequestFormsPage() {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Get today's patients who need test selection
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Request Forms</h1>
          <p className="text-gray-600 mt-1">
            Review patient request forms and clinical history
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by patient ID or name..."
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
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No request forms found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Registered patients will appear here'}
              </p>
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
                      Referring Doctor
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Urgency
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
                        <div className="text-sm text-gray-500">
                          {patient.gender}, {patient.phoneNumber}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {patient.referringDoctor || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            patient.urgency === 'STAT'
                              ? 'bg-red-100 text-red-800'
                              : patient.urgency === 'Urgent'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {patient.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {format(patient.registrationDate, 'dd MMM yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/dashboard/clerk/tests/${patient.id}`}>
                          <Button size="sm" className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Select Tests
                          </Button>
                        </Link>
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
