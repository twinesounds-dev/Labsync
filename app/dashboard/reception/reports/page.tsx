'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { 
  FileText, 
  Search, 
  Printer, 
  Eye, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Combine
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestResult, Patient, Test, Facility, User } from '@/types';
import ClinicalReport from '@/components/reports/ClinicalReport';

interface ReportWithDetails extends TestResult {
  patient?: Patient;
  test?: Test;
  performedByUser?: User;
  approvedByUser?: User;
}

interface PatientReportGroup {
  patientId: string;
  patient: Patient;
  reports: ReportWithDetails[];
  totalTests: number;
  criticalValues: number;
  latestDate: Date;
  earliestDate: Date;
}

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [patientGroups, setPatientGroups] = useState<PatientReportGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'individual' | 'grouped'>('grouped');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportWithDetails | null>(null);
  const [selectedPatientGroup, setSelectedPatientGroup] = useState<PatientReportGroup | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [showCombinedReport, setShowCombinedReport] = useState(false);

  useEffect(() => {
    if (!userProfile?.facilityId) {
      setLoading(false);
      return;
    }

    // Load facility data
    const loadFacility = async () => {
      try {
        const facilityData = await firestoreService.getById<Facility>(COLLECTIONS.FACILITIES, userProfile.facilityId);
        setFacility(facilityData);
      } catch (error) {
        console.error('Error loading facility:', error);
      }
    };

    loadFacility();

    // Subscribe to approved test results
    const reportsQuery = query(
      collection(db, COLLECTIONS.TEST_RESULTS),
      where('facilityId', '==', userProfile.facilityId),
      where('status', '==', 'Approved'),
      orderBy('dateApproved', 'desc')
    );

    const unsubscribe = onSnapshot(reportsQuery, async (snapshot) => {
      const reportsData: ReportWithDetails[] = [];

      for (const doc of snapshot.docs) {
        const reportData = {
          id: doc.id,
          ...doc.data(),
          datePerformed: doc.data().datePerformed?.toDate() || new Date(),
          dateSubmitted: doc.data().dateSubmitted?.toDate() || new Date(),
          dateApproved: doc.data().dateApproved?.toDate() || new Date(),
          printedDate: doc.data().printedDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as ReportWithDetails;

        // Load patient data
        if (reportData.patientId) {
          try {
            const patient = await firestoreService.getById(COLLECTIONS.PATIENTS, reportData.patientId);
            reportData.patient = patient as Patient;
          } catch (error) {
            console.error('Error loading patient:', error);
          }
        }

        // Load test data
        if (reportData.testId) {
          try {
            const test = await firestoreService.getById(COLLECTIONS.TESTS, reportData.testId);
            reportData.test = test as Test;
          } catch (error) {
            console.error('Error loading test:', error);
          }
        }

        // Load performed by user data
        if (reportData.performedBy) {
          try {
            const user = await firestoreService.getById(COLLECTIONS.USERS, reportData.performedBy);
            reportData.performedByUser = user as User;
          } catch (error) {
            console.error('Error loading user:', error);
          }
        }

        // Load approved by user data
        if (reportData.approvedBy) {
          try {
            const user = await firestoreService.getById(COLLECTIONS.USERS, reportData.approvedBy);
            reportData.approvedByUser = user as User;
          } catch (error) {
            console.error('Error loading approver:', error);
          }
        }

        reportsData.push(reportData);
      }

      setReports(reportsData);
      
      // Group reports by patient
      const groupedByPatient = reportsData.reduce((acc, report) => {
        if (!report.patient) return acc;
        
        const patientId = report.patient.patientId;
        if (!acc[patientId]) {
          acc[patientId] = {
            patientId,
            patient: report.patient,
            reports: [],
            totalTests: 0,
            criticalValues: 0,
            latestDate: report.dateApproved || new Date(),
            earliestDate: report.dateApproved || new Date(),
          };
        }
        
        acc[patientId].reports.push(report);
        acc[patientId].totalTests++;
        
        // Count critical values
        const criticalCount = report.resultValues?.filter(rv => 
          rv.flag === 'Critical' || rv.flag === 'High' || rv.flag === 'Low'
        ).length || 0;
        acc[patientId].criticalValues += criticalCount;
        
        // Update date range
        if (report.dateApproved && report.dateApproved > acc[patientId].latestDate) {
          acc[patientId].latestDate = report.dateApproved;
        }
        if (report.dateApproved && report.dateApproved < acc[patientId].earliestDate) {
          acc[patientId].earliestDate = report.dateApproved;
        }
        
        return acc;
      }, {} as Record<string, PatientReportGroup>);

      setPatientGroups(Object.values(groupedByPatient));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.facilityId]);

  const handlePrintReport = async (reportId: string) => {
    try {
      // Mark as printed
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, reportId, {
        printedBy: userProfile?.id,
        printedDate: new Date(),
        status: 'Printed',
        updatedAt: new Date(),
      });

      window.print();
      alert('Report printed successfully!');
    } catch (error) {
      console.error('Error marking as printed:', error);
      alert('Failed to mark report as printed');
    }
  };

  const handlePrintCombinedReport = async (patientGroup: PatientReportGroup) => {
    try {
      // Mark all reports as printed
      for (const report of patientGroup.reports) {
        await firestoreService.update(COLLECTIONS.TEST_RESULTS, report.id, {
          printedBy: userProfile?.id,
          printedDate: new Date(),
          status: 'Printed',
          updatedAt: new Date(),
        });
      }

      window.print();
      alert('Combined report printed successfully!');
      setShowCombinedReport(false);
      setSelectedPatientGroup(null);
    } catch (error) {
      console.error('Error marking reports as printed:', error);
      alert('Failed to mark reports as printed');
    }
  };

  const getFilteredReports = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.patient?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.patient?.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.test?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => {
        if (statusFilter === 'printed') return report.printedDate;
        if (statusFilter === 'ready') return !report.printedDate;
        return true;
      });
    }

    return filtered;
  };

  const getFilteredPatientGroups = () => {
    let filtered = patientGroups;

    if (searchTerm) {
      filtered = filtered.filter(group => 
        group.patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.patient.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.patient.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.reports.some(r => r.test?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => {
        if (statusFilter === 'printed') return group.reports.every(r => r.printedDate);
        if (statusFilter === 'ready') return group.reports.some(r => !r.printedDate);
        return true;
      });
    }

    return filtered;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (report: ReportWithDetails) => {
    if (report.printedDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Printed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Clock className="w-3 h-3 mr-1" />
        Ready
      </span>
    );
  };

  const getCriticalityBadge = (criticalCount: number) => {
    if (criticalCount === 0) return null;
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {criticalCount} Critical
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading reports...</div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredReports = getFilteredReports();
  const filteredPatientGroups = getFilteredPatientGroups();

  return (
    <DashboardLayout>
      <div>
        {showCombinedReport && selectedPatientGroup && facility ? (
          /* Combined Report View */
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Combined Patient Report</h2>
                  <p className="text-sm text-gray-600">
                    Patient: {selectedPatientGroup.patient.surname}, {selectedPatientGroup.patient.givenName} 
                    ({selectedPatientGroup.patient.patientId}) • {selectedPatientGroup.totalTests} Tests
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCombinedReport(false);
                      setSelectedPatientGroup(null);
                    }}
                  >
                    Back to List
                  </Button>
                  <Button
                    onClick={() => handlePrintCombinedReport(selectedPatientGroup)}
                    className="no-print"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Combined Report
                  </Button>
                </div>
              </div>
            </Card>

            {/* Combined Clinical Report */}
            <CombinedClinicalReport
              patientGroup={selectedPatientGroup}
              facility={facility}
            />
          </div>
        ) : selectedReport ? (
          /* Individual Report View */
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Individual Test Report</h2>
                  <p className="text-sm text-gray-600">
                    Patient: {selectedReport.patient?.surname}, {selectedReport.patient?.givenName} 
                    ({selectedReport.patient?.patientId})
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReport(null)}
                  >
                    Back to List
                  </Button>
                  <Button
                    onClick={() => handlePrintReport(selectedReport.id)}
                    className="no-print"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                </div>
              </div>
            </Card>

            {facility && selectedReport.test && selectedReport.patient && (
              <ClinicalReport
                testResult={selectedReport}
                patient={selectedReport.patient}
                test={selectedReport.test}
                facility={facility}
                performedBy={selectedReport.performedByUser}
                approvedBy={selectedReport.approvedByUser}
                reportId={`RPT-${selectedReport.id.slice(-8).toUpperCase()}`}
              />
            )}
          </div>
        ) : (
          /* Reports List View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Clinical Reports</h1>
                <p className="text-gray-600 mt-1">
                  Advanced report management with combined reporting capabilities
                </p>
              </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Total Reports</p>
                    <p className="text-2xl font-bold text-blue-900">{reports.length}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Ready to Print</p>
                    <p className="text-2xl font-bold text-green-900">
                      {reports.filter(r => !r.printedDate).length}
                    </p>
                  </div>
                  <Printer className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Unique Patients</p>
                    <p className="text-2xl font-bold text-purple-900">{patientGroups.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600 opacity-50" />
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-700 font-medium">Critical Values</p>
                    <p className="text-2xl font-bold text-red-900">
                      {patientGroups.reduce((sum, group) => sum + group.criticalValues, 0)}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600 opacity-50" />
                </div>
              </Card>
            </div>

            {/* Controls */}
            <Card>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by patient ID, name, or test..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border-none focus:ring-0"
                  />
                </div>
                <div className="flex gap-3">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="min-w-32"
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'ready', label: 'Ready to Print' },
                      { value: 'printed', label: 'Already Printed' }
                    ]}
                  />
                  <Select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'individual' | 'grouped')}
                    className="min-w-32"
                    options={[
                      { value: 'grouped', label: 'Grouped by Patient' },
                      { value: 'individual', label: 'Individual Reports' }
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Reports Content */}
            {viewMode === 'grouped' ? (
              /* Grouped View */
              <Card>
                {filteredPatientGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No patient groups found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm ? 'Try a different search term' : 'No approved reports available'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPatientGroups.map((group) => (
                      <div key={group.patientId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {group.patient.surname}, {group.patient.givenName}
                              </h3>
                              <p className="text-sm text-gray-600">ID: {group.patient.patientId}</p>
                            </div>
                            <div className="flex space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Activity className="w-3 h-3 mr-1" />
                                {group.totalTests} Tests
                              </span>
                              {getCriticalityBadge(group.criticalValues)}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPatientGroup(group);
                                setShowCombinedReport(true);
                              }}
                            >
                              <Combine className="w-4 h-4 mr-1" />
                              Combined Report
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.reports.map((report) => (
                            <div key={report.id} className="bg-white border border-gray-100 rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm text-gray-900">{report.test?.name}</h4>
                                {getStatusBadge(report)}
                              </div>
                              <p className="text-xs text-gray-600 mb-2">
                                Approved: {report.dateApproved ? formatDate(report.dateApproved) : 'N/A'}
                              </p>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedReport(report)}
                                  className="text-xs px-2 py-1"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                                {!report.printedDate && (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePrintReport(report.id)}
                                    className="text-xs px-2 py-1"
                                  >
                                    <Printer className="w-3 h-3 mr-1" />
                                    Print
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              /* Individual View */
              <Card>
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No reports found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm ? 'Try a different search term' : 'No approved reports available'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Patient Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Test</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Approved Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReports.map((report) => (
                          <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-primary">
                              {report.patient?.patientId}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-900">
                                {report.patient?.surname} {report.patient?.givenName}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{report.test?.name}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {report.dateApproved ? formatDate(report.dateApproved) : 'N/A'}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(report)}</td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedReport(report)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                {!report.printedDate && (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePrintReport(report.id)}
                                  >
                                    <Printer className="w-4 h-4 mr-1" />
                                    Print
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Combined Clinical Report Component
function CombinedClinicalReport({ 
  patientGroup, 
  facility 
}: { 
  patientGroup: PatientReportGroup;
  facility: Facility;
}) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getClinicalSummary = () => {
    const allResults = patientGroup.reports.flatMap(r => r.resultValues || []);
    const abnormalResults = allResults.filter(rv => rv.flag !== 'Normal' && rv.flag !== 'N/A');
    const criticalResults = allResults.filter(rv => rv.flag === 'Critical');
    
    return {
      totalParameters: allResults.length,
      abnormalCount: abnormalResults.length,
      criticalCount: criticalResults.length,
      abnormalResults,
      criticalResults
    };
  };

  const summary = getClinicalSummary();

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 print:bg-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{facility.name}</h1>
            <p className="text-blue-100">{facility.address}</p>
            <p className="text-blue-100">Tel: {facility.phone} | Email: {facility.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">COMBINED LABORATORY REPORT</h2>
            <p className="text-blue-100">Report ID: CMB-{patientGroup.patientId}-{Date.now().toString().slice(-6)}</p>
            <p className="text-blue-100">Generated: {formatDate(new Date())}</p>
          </div>
        </div>
      </div>

      {/* Critical Values Alert */}
      {summary.criticalCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 print:border-red-800">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">CRITICAL VALUES DETECTED</h3>
              <p className="text-red-700">
                {summary.criticalCount} critical value(s) require immediate clinical attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Information */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><span className="font-medium">Patient ID:</span> {patientGroup.patient.patientId}</p>
            <p><span className="font-medium">Name:</span> {patientGroup.patient.surname}, {patientGroup.patient.givenName}</p>
            <p><span className="font-medium">Date of Birth:</span> {patientGroup.patient.dateOfBirth ? new Date(patientGroup.patient.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'}</p>
            <p><span className="font-medium">Gender:</span> {patientGroup.patient.gender}</p>
          </div>
          <div>
            <p><span className="font-medium">Phone:</span> {patientGroup.patient.phoneNumber}</p>
            <p><span className="font-medium">Address:</span> {patientGroup.patient.address.village}, {patientGroup.patient.address.district}</p>
            <p><span className="font-medium">Test Period:</span> {formatDate(patientGroup.earliestDate)} - {formatDate(patientGroup.latestDate)}</p>
            <p><span className="font-medium">Total Tests:</span> {patientGroup.totalTests}</p>
          </div>
        </div>
      </div>

      {/* Clinical Summary */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-700 font-medium">Total Parameters</p>
            <p className="text-2xl font-bold text-blue-900">{summary.totalParameters}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <p className="text-sm text-yellow-700 font-medium">Abnormal Results</p>
            <p className="text-2xl font-bold text-yellow-900">{summary.abnormalCount}</p>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <p className="text-sm text-red-700 font-medium">Critical Values</p>
            <p className="text-2xl font-bold text-red-900">{summary.criticalCount}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-sm text-green-700 font-medium">Normal Results</p>
            <p className="text-2xl font-bold text-green-900">{summary.totalParameters - summary.abnormalCount}</p>
          </div>
        </div>

        {summary.criticalCount > 0 && (
          <div className="bg-red-50 p-3 rounded mb-4">
            <h4 className="font-semibold text-red-800 mb-2">Critical Values Requiring Immediate Attention:</h4>
            <ul className="list-disc list-inside text-red-700 text-sm">
              {summary.criticalResults.map((result, index) => (
                <li key={index}>
                  {result.parameter}: {result.value} {result.unit} (Normal: {result.normalRange})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Individual Test Results */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Test Results</h3>
        <div className="space-y-6">
          {patientGroup.reports.map((report) => (
            <div key={report.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">{report.test?.name}</h4>
                <div className="text-sm text-gray-600">
                  <p>Performed: {formatDate(report.datePerformed)}</p>
                  <p>Approved: {report.dateApproved ? formatDate(report.dateApproved) : 'N/A'}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold text-gray-700">Parameter</th>
                      <th className="text-left py-2 font-semibold text-gray-700">Result</th>
                      <th className="text-left py-2 font-semibold text-gray-700">Unit</th>
                      <th className="text-left py-2 font-semibold text-gray-700">Reference Range</th>
                      <th className="text-left py-2 font-semibold text-gray-700">Interpretation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.resultValues?.map((result, resultIndex) => (
                      <tr key={resultIndex} className="border-b border-gray-100">
                        <td className="py-2 font-medium">{result.parameter}</td>
                        <td className="py-2">{result.value}</td>
                        <td className="py-2">{result.unit}</td>
                        <td className="py-2">{result.normalRange}</td>
                        <td className="py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            result.flag === 'Critical' ? 'bg-red-100 text-red-800' :
                            result.flag === 'High' || result.flag === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {result.flag || 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {report.remarks && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm"><span className="font-medium">Remarks:</span> {report.remarks}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Interpretation */}
      {summary.abnormalCount > 0 && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinical Interpretation</h3>
          <div className="bg-yellow-50 p-4 rounded">
            <p className="text-sm text-gray-700">
              This combined report shows {summary.abnormalCount} abnormal result(s) out of {summary.totalParameters} total parameters tested. 
              {summary.criticalCount > 0 && ` ${summary.criticalCount} critical value(s) require immediate clinical attention.`}
              Please correlate these findings with clinical presentation and consider appropriate follow-up investigations as indicated.
            </p>
          </div>
        </div>
      )}

      {/* Authorization */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Laboratory Authorization</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Performed by:</span> {patientGroup.reports[0]?.performedByUser ? `${patientGroup.reports[0].performedByUser.firstName} ${patientGroup.reports[0].performedByUser.lastName}` : 'Lab Technician'}</p>
              <p><span className="font-medium">Approved by:</span> {patientGroup.reports[0]?.approvedByUser ? `${patientGroup.reports[0].approvedByUser.firstName} ${patientGroup.reports[0].approvedByUser.lastName}` : 'Laboratory Director'}</p>
              <p><span className="font-medium">Report generated:</span> {formatDate(new Date())}</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Quality Assurance</h4>
            <p className="text-sm text-gray-600">
              All tests performed using validated methods with appropriate quality control measures. 
              Results are verified and approved by qualified laboratory personnel.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-100 text-center text-xs text-gray-600 print:bg-gray-200">
        <p>This is a computer-generated combined laboratory report. For any queries, please contact the laboratory.</p>
        <p className="mt-1">Report generated on {formatDate(new Date())} | {facility.name}</p>
      </div>
    </div>
  );
}
