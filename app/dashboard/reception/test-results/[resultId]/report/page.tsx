'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TestReport from '@/components/reports/TestReport';
import SampleTracker from '@/components/tracking/SampleTracker';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, Download, Printer, Share2, Eye } from 'lucide-react';
import Link from 'next/link';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestResult, TestRequest, Facility } from '@/types';

export default function TestReportPage() {
  const params = useParams();
  const resultId = params.resultId as string;
  const { userProfile } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [request, setRequest] = useState<TestRequest | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'report' | 'tracking'>('report');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch test result
        const resultData = await firestoreService.getById<TestResult>(
          COLLECTIONS.TEST_RESULTS,
          resultId
        );
        setResult(resultData);

        // Fetch corresponding test request
        if (resultData?.testRequestId) {
          const requestData = await firestoreService.getById<TestRequest>(
            COLLECTIONS.TEST_REQUESTS,
            resultData.testRequestId
          );
          setRequest(requestData);
        }

        // Fetch facility information
        if (userProfile?.facilityId) {
          const facilityData = await firestoreService.getById<Facility>(
            COLLECTIONS.FACILITIES,
            userProfile.facilityId
          );
          setFacility(facilityData);
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resultId, userProfile?.facilityId]);

  const handlePrint = async () => {
    if (!result) return;

    setPrinting(true);
    try {
      // Update result status to printed
      await firestoreService.update(COLLECTIONS.TEST_RESULTS, result.id, {
        status: 'Printed',
        printedBy: userProfile?.id,
        printedDate: new Date(),
      });

      // Trigger browser print
      window.print();
      
      setResult({ ...result, status: 'Printed' });
    } catch (error) {
      console.error('Error printing result:', error);
      alert('Failed to print result');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownload = async () => {
    // This would integrate with a PDF generation service
    alert('PDF download functionality would be implemented here with a service like jsPDF or Puppeteer');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Lab Report - ${request?.patient?.surname} ${request?.patient?.givenName}`,
        text: 'Laboratory test report',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Report link copied to clipboard');
    }
  };

  if (loading || !result || !request) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading test report...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <div className="flex items-center">
            <Link href="/dashboard/reception/test-results">
              <Button size="sm" className="mr-4 bg-gray-500 hover:bg-gray-600">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Test Report</h1>
              <p className="text-gray-600 mt-1">
                {request.patient?.surname} {request.patient?.givenName} - {result.test?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(view === 'report' ? 'tracking' : 'report')}
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{view === 'report' ? 'View Tracking' : 'View Report'}</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
            
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>{printing ? 'Printing...' : 'Print'}</span>
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        {result.status !== 'Approved' && (
          <Card className="mb-6 border-orange-200 bg-orange-50 print:hidden">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-orange-600" />
              <div>
                <h4 className="font-semibold text-orange-900">Report Status: {result.status}</h4>
                <p className="text-orange-800 text-sm">
                  {result.status === 'Submitted' 
                    ? 'This report is pending approval and should not be released to the patient yet.'
                    : result.status === 'Rejected'
                    ? 'This report has been rejected and requires revision.'
                    : 'This report is in draft status.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Content */}
        {view === 'report' ? (
          <TestReport
            result={result}
            request={request}
            patient={request.patient!}
            facility={facility || undefined}
            onPrint={handlePrint}
            onDownload={handleDownload}
          />
        ) : (
          <SampleTracker
            request={request}
            results={[result]}
            onViewDetails={() => setView('report')}
          />
        )}

        {/* Print-only Footer */}
        <div className="hidden print:block mt-8 pt-4 border-t">
          <div className="text-center text-sm text-gray-600">
            <p>This report was printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            <p>Report ID: {result.id} | Facility: {facility?.name}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            margin: 1in;
            size: A4;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}