'use client';

import { TestResult, Patient, Test, Facility, User } from '@/types';

interface TestReportProps {
  testResult: TestResult;
  patient: Patient;
  test: Test;
  facility: Facility;
  performedBy?: User;
  approvedBy?: User;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function TestReport({
  testResult,
  patient,
  test,
  facility,
  performedBy,
  approvedBy,
  showHeader = true,
  showFooter = true,
}: TestReportProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAgeFromDOB = (dob: Date | string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getFlagColor = (flag: string) => {
    switch (flag) {
      case 'High':
        return 'text-red-600 font-semibold';
      case 'Low':
        return 'text-blue-600 font-semibold';
      case 'Critical':
        return 'text-red-800 font-bold bg-red-100 px-1 rounded';
      case 'Normal':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getFlagSymbol = (flag: string) => {
    switch (flag) {
      case 'High':
        return '↑';
      case 'Low':
        return '↓';
      case 'Critical':
        return '⚠';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-6 print:max-w-none print:shadow-none">
      {/* Header */}
      {showHeader && (
        <div className="border-b-2 border-primary pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary mb-2">{facility.name}</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p>{facility.address}</p>
                <p>Tel: {facility.phone} | Email: {facility.email}</p>
                <p>License No: {facility.licenseNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-primary text-white px-4 py-2 rounded-lg">
                <h2 className="text-lg font-semibold">LABORATORY REPORT</h2>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Report ID: {testResult.id.slice(-8).toUpperCase()}</p>
                <p>Date: {formatDate(testResult.datePerformed)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Information */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
            PATIENT INFORMATION
          </h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Patient ID:</span>
              <span className="col-span-2 font-mono">{patient.patientId}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Name:</span>
              <span className="col-span-2">{patient.surname}, {patient.givenName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Date of Birth:</span>
              <span className="col-span-2">{formatDate(patient.dateOfBirth)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Age:</span>
              <span className="col-span-2">{getAgeFromDOB(patient.dateOfBirth)} years</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Gender:</span>
              <span className="col-span-2">{patient.gender}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Phone:</span>
              <span className="col-span-2">{patient.phoneNumber}</span>
            </div>
            {patient.referringDoctor && (
              <div className="grid grid-cols-3 gap-2">
                <span className="font-medium text-gray-700">Referring Dr:</span>
                <span className="col-span-2">{patient.referringDoctor}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
            TEST INFORMATION
          </h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Test:</span>
              <span className="col-span-2 font-medium">{test.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Test Code:</span>
              <span className="col-span-2 font-mono">{test.code}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Sample Type:</span>
              <span className="col-span-2">{test.sampleType}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Collection Date:</span>
              <span className="col-span-2">{formatDate(testResult.testRequest?.sampleCollectionDate || testResult.datePerformed)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Report Date:</span>
              <span className="col-span-2">{formatDate(testResult.datePerformed)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-medium text-gray-700">Urgency:</span>
              <span className={`col-span-2 ${
                patient.urgency === 'STAT' ? 'text-red-600 font-semibold' :
                patient.urgency === 'Urgent' ? 'text-orange-600 font-medium' :
                'text-gray-600'
              }`}>
                {patient.urgency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Information */}
      {(patient.clinicalHistory || patient.referringDoctor) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
            CLINICAL INFORMATION
          </h3>
          <div className="text-sm space-y-2">
            {patient.clinicalHistory && (
              <div>
                <span className="font-medium text-gray-700">Clinical History: </span>
                <span>{patient.clinicalHistory}</span>
              </div>
            )}
            {patient.hospitalClinic && (
              <div>
                <span className="font-medium text-gray-700">Hospital/Clinic: </span>
                <span>{patient.hospitalClinic}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-1">
          TEST RESULTS
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">
                  Parameter
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                  Result
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                  Unit
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                  Reference Range
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">
                  Flag
                </th>
              </tr>
            </thead>
            <tbody>
              {testResult.resultValues.map((result, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                    {result.parameter}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center font-mono">
                    {result.value}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                    {result.unit}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-sm text-gray-600">
                    {result.normalRange}
                  </td>
                  <td className={`border border-gray-300 px-4 py-3 text-center text-sm ${getFlagColor(result.flag)}`}>
                    {getFlagSymbol(result.flag)} {result.flag}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Remarks */}
        {testResult.remarks && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Laboratory Comments:</h4>
            <p className="text-sm text-gray-700">{testResult.remarks}</p>
          </div>
        )}

        {/* Critical Values Alert */}
        {testResult.resultValues.some(r => r.flag === 'Critical') && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-600 font-bold text-lg mr-2">⚠</span>
              <div>
                <h4 className="font-semibold text-red-900">CRITICAL VALUES ALERT</h4>
                <p className="text-sm text-red-700">
                  This report contains critical values that require immediate clinical attention.
                  The referring physician has been notified.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Method and Quality Control */}
      <div className="mb-6 text-xs text-gray-600">
        <h4 className="font-semibold text-gray-900 mb-2">METHODOLOGY & QUALITY CONTROL</h4>
        <p>
          All tests performed using validated methods with appropriate quality control measures.
          Results are traceable to international reference standards where applicable.
        </p>
      </div>

      {/* Signatures and Authorization */}
      {showFooter && (
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">PERFORMED BY</h4>
              <div className="text-sm">
                <p className="font-medium">{performedBy?.firstName} {performedBy?.lastName}</p>
                <p className="text-gray-600">Medical Laboratory Technologist</p>
                <p className="text-gray-600">Date: {formatDateTime(testResult.datePerformed)}</p>
                <div className="mt-4 border-b border-gray-300 w-48"></div>
                <p className="text-xs text-gray-500 mt-1">Signature</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">AUTHORIZED BY</h4>
              <div className="text-sm">
                <p className="font-medium">{approvedBy?.firstName} {approvedBy?.lastName}</p>
                <p className="text-gray-600">Laboratory Director</p>
                <p className="text-gray-600">Date: {testResult.dateApproved ? formatDateTime(testResult.dateApproved) : '___________'}</p>
                <div className="mt-4 border-b border-gray-300 w-48"></div>
                <p className="text-xs text-gray-500 mt-1">Signature</p>
              </div>
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <div className="flex justify-between items-center">
              <div>
                <p>This report is electronically generated and valid without signature when printed from authorized system.</p>
                <p>For any queries regarding this report, please contact the laboratory at {facility.phone}</p>
              </div>
              <div className="text-right">
                <p>Page 1 of 1</p>
                <p>Printed: {formatDateTime(new Date())}</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
            <p className="font-semibold mb-1">IMPORTANT NOTES:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>This report should be interpreted in conjunction with clinical findings and other laboratory data.</li>
              <li>Reference ranges may vary based on age, gender, and methodology used.</li>
              <li>Critical values have been communicated to the requesting physician as per laboratory policy.</li>
              <li>This report is confidential and intended only for the use of the requesting physician and patient.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:p-6 { padding: 1.5rem; }
          .print\\:max-w-none { max-width: none; }
          .print\\:shadow-none { box-shadow: none; }
          
          /* Ensure proper page breaks */
          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          
          /* Hide elements that shouldn't print */
          .no-print { display: none !important; }
          
          /* Optimize table printing */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>
    </div>
  );
}