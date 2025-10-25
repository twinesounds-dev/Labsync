'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { AlertTriangle, CheckCircle, FileText } from 'lucide-react';

export default function QualityControlPage() {
  const [qcRecords] = useState([
    {
      id: '1',
      equipment: 'Hematology Analyzer',
      date: new Date('2024-01-15'),
      status: 'Pass',
      performedBy: 'John Doe',
      notes: 'All parameters within range',
    },
    {
      id: '2',
      equipment: 'Chemistry Analyzer',
      date: new Date('2024-01-14'),
      status: 'Pass',
      performedBy: 'Jane Smith',
      notes: 'Calibration successful',
    },
  ]);

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
          <p className="text-gray-600 mt-1">
            Equipment calibration and quality control documentation
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">QC Tests Passed</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {qcRecords.filter((r) => r.status === 'Pass').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">QC Alerts</p>
                <p className="text-3xl font-bold text-red-900 mt-1">0</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">
                  Total QC Records
                </p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {qcRecords.length}
                </p>
              </div>
              <FileText className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* QC Records */}
        <Card title="Quality Control Records">
          <div className="mb-4 flex gap-3">
            <Input
              type="text"
              placeholder="Search equipment..."
              className="flex-1"
            />
            <Button>Add QC Record</Button>
          </div>

          {qcRecords.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No QC records yet
              </h3>
              <p className="text-gray-600">Start by adding a quality control record</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Equipment
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Performed By
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {qcRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {record.equipment}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {record.date.toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'Pass'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {record.performedBy}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{record.notes}</td>
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
