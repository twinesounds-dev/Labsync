'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Download, Eye, FileText, Calendar, User, TestTube } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import { LabReport, Patient, TestResult, Facility } from '@/lib/types';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<LabReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<LabReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from the database
  useEffect(() => {
    const mockReports: LabReport[] = [
      {
        id: '1',
        patientId: '1',
        patient: {
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
        testRequestId: '1',
        facilityId: 'flnt',
        facility: {
          id: 'flnt',
          name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO',
          code: 'FLNT',
          address: 'Ntungamo, Uganda',
          phone: '+256 XXX XXX XXX',
          email: 'ntungamo@labsync.ug',
          isActive: true,
          createdAt: new Date(),
        },
        reportNumber: 'RPT-FLNT-20241224-001',
        dateCollected: new Date('2024-12-24T09:00:00'),
        dateReported: new Date('2024-12-24T14:00:00'),
        technician: 'John Technician',
        approvedBy: 'Dr. Smith (Owner)',
        results: [],
        comments: 'All results within normal limits',
        isPrinted: false,
        createdAt: new Date('2024-12-24T14:00:00'),
      },
      {
        id: '2',
        patientId: '2',
        patient: {
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
        testRequestId: '2',
        facilityId: 'flnt',
        facility: {
          id: 'flnt',
          name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO',
          code: 'FLNT',
          address: 'Ntungamo, Uganda',
          phone: '+256 XXX XXX XXX',
          email: 'ntungamo@labsync.ug',
          isActive: true,
          createdAt: new Date(),
        },
        reportNumber: 'RPT-FLNT-20241224-002',
        dateCollected: new Date('2024-12-24T10:30:00'),
        dateReported: new Date('2024-12-24T12:30:00'),
        technician: 'John Technician',
        approvedBy: 'Dr. Smith (Owner)',
        results: [],
        comments: 'Positive result - pregnancy confirmed',
        isPrinted: true,
        printedAt: new Date('2024-12-24T15:00:00'),
        printedBy: 'Jane Receptionist',
        createdAt: new Date('2024-12-24T12:30:00'),
      },
    ];

    setReports(mockReports);
    setFilteredReports(mockReports);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.patient?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.patient?.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(report => 
            new Date(report.dateReported) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(report => 
            new Date(report.dateReported) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(report => 
            new Date(report.dateReported) >= filterDate
          );
          break;
      }
    }

    setFilteredReports(filtered);
  }, [searchTerm, dateFilter, reports]);

  const handlePrint = (report: LabReport) => {
    // In a real app, this would generate and print the PDF
    console.log('Printing report:', report);
    // Update printed status
    setReports(reports.map(r => 
      r.id === report.id 
        ? { 
            ...r, 
            isPrinted: true, 
            printedAt: new Date(), 
            printedBy: user?.name || 'Unknown' 
          } 
        : r
    ));
  };

  const handleDownload = (report: LabReport) => {
    // In a real app, this would generate and download the PDF
    console.log('Downloading report:', report);
  };

  const handleView = (report: LabReport) => {
    // In a real app, this would open a detailed view or preview
    console.log('Viewing report:', report);
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
          <h1 className="text-3xl font-bold text-gray-900">Lab Reports</h1>
          <p className="text-gray-600 mt-2">
            Generate, view, and manage laboratory reports
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              All time reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printed Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => {
                const today = new Date();
                const reportDate = new Date(r.dateReported);
                return reportDate.toDateString() === today.toDateString() && r.isPrinted;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Reports printed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Print</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reports.filter(r => !r.isPrinted).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Reports awaiting print
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter(r => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(r.dateReported) >= weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Reports this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports by patient name, ID, or report number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No reports found</p>
              <p className="text-gray-400 mt-2">
                {searchTerm || dateFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'No laboratory reports available'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {report.patient?.givenName} {report.patient?.surname}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Report: {report.reportNumber} | Patient ID: {report.patient?.patientId}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.isPrinted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {report.isPrinted ? 'Printed' : 'Pending Print'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Collected:</strong> {formatDate(report.dateCollected)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Reported:</strong> {formatDate(report.dateReported)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Technician:</strong> {report.technician}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Approved By:</strong> {report.approvedBy}
                        </p>
                        {report.isPrinted && (
                          <>
                            <p className="text-sm text-gray-600">
                              <strong>Printed:</strong> {report.printedAt && formatDate(report.printedAt)}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Printed By:</strong> {report.printedBy}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {report.comments && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Comments:</strong> {report.comments}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Created: {formatDate(report.createdAt)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(report)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrint(report)}
                          disabled={report.isPrinted}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {report.isPrinted ? 'Reprint' : 'Print'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}