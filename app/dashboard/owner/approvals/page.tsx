'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { CheckCircle, XCircle, Clock, User, TestTube, Calendar } from 'lucide-react';

export default function ApprovalsPage() {
  const [pendingApprovals] = useState([
    {
      id: '1',
      patientName: 'John Mugisha',
      patientId: 'FLNT-00123',
      testName: 'Full Hemogram',
      testCode: 'FBC',
      facility: 'FIRSTLINE - NTUNGAMO',
      submittedBy: 'Grace Namusoke',
      submittedDate: '2024-10-25T08:30:00Z',
      urgency: 'Routine',
      status: 'Pending',
    },
    {
      id: '2',
      patientName: 'Sarah Nakato',
      patientId: 'FLMB-00456',
      testName: 'Liver Function Tests',
      testCode: 'LFT',
      facility: 'FIRSTLINE - MBARARA',
      submittedBy: 'Agnes Nansubuga',
      submittedDate: '2024-10-25T09:15:00Z',
      urgency: 'Urgent',
      status: 'Pending',
    },
    {
      id: '3',
      patientName: 'David Okello',
      patientId: 'PCMC-00789',
      testName: 'Malaria Parasite Test',
      testCode: 'MP',
      facility: 'PRIMECURE MEDICAL',
      submittedBy: 'Mary Kwagala',
      submittedDate: '2024-10-25T10:00:00Z',
      urgency: 'STAT',
      status: 'Pending',
    },
  ]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'STAT':
        return 'bg-red-100 text-red-800';
      case 'Urgent':
        return 'bg-orange-100 text-orange-800';
      case 'Routine':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Test Result Approvals</h1>
          <div className="flex space-x-2">
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Facilities</option>
              <option value="FLNT">FIRSTLINE - NTUNGAMO</option>
              <option value="FLMB">FIRSTLINE - MBARARA</option>
              <option value="PCMC">PRIMECURE MEDICAL</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">All Urgency</option>
              <option value="STAT">STAT</option>
              <option value="Urgent">Urgent</option>
              <option value="Routine">Routine</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pending Approvals</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">12</p>
              </div>
              <Clock className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">STAT Priority</p>
                <p className="text-3xl font-bold text-red-900 mt-1">3</p>
              </div>
              <TestTube className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Approved Today</p>
                <p className="text-3xl font-bold text-green-900 mt-1">28</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rejected Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">2</p>
              </div>
              <XCircle className="w-12 h-12 text-gray-500 opacity-50" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingApprovals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{approval.patientName}</div>
                          <div className="text-sm text-gray-500">{approval.patientId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{approval.testName}</div>
                      <div className="text-sm text-gray-500">{approval.testCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.facility}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.submittedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(approval.submittedDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyColor(approval.urgency)}`}>
                        {approval.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors">
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Approve
                      </button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}