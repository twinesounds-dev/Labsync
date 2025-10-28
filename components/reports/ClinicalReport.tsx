'use client';

import { TestResult, Patient, Test, Facility, User } from '@/types';

interface ClinicalReportProps {
  testResult: TestResult;
  patient: Patient;
  test: Test;
  facility: Facility;
  performedBy?: User;
  approvedBy?: User;
  reportId?: string;
}

export default function ClinicalReport({
  testResult,
  patient,
  test,
  facility,
  performedBy,
  approvedBy,
  reportId,
}: ClinicalReportProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB') + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateAge = (dob: Date | string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getResultInterpretation = (flag: string) => {
    switch (flag) {
      case 'High':
        return { color: 'text-red-600', symbol: '↑', interpretation: 'Above normal range' };
      case 'Low':
        return { color: 'text-blue-600', symbol: '↓', interpretation: 'Below normal range' };
      case 'Critical':
        return { color: 'text-red-800', symbol: '⚠', interpretation: 'Critical value - immediate attention required' };
      case 'Normal':
        return { color: 'text-green-600', symbol: '', interpretation: 'Within normal limits' };
      default:
        return { color: 'text-gray-600', symbol: '', interpretation: 'Not applicable' };
    }
  };

  const hasCriticalValues = testResult.resultValues.some(r => r.flag === 'Critical');
  const hasAbnormalValues = testResult.resultValues.some(r => r.flag === 'High' || r.flag === 'Low' || r.flag === 'Critical');

  return (
    <div className="bg-white max-w-4xl mx-auto print:max-w-none print:shadow-none">
      {/* Header */}
      <div className="border-b-2 border-primary pb-6 mb-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">{facility.name}</h1>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{facility.address}</p>
            <p>Tel: {facility.phone} | Email: {facility.email}</p>
            <p>License No: {facility.licenseNumber}</p>
          </div>
          <div className="mt-4 bg-primary text-white px-6 py-3 rounded-lg inline-block">
            <h2 className="text-xl font-bold">LABORATORY REPORT</h2>
          </div>
        </div>
        
        <div className="flex justify-between items-start mt-4">
          <div>
            <p className="text-sm text-gray-600">Report ID: <span className="font-mono font-semibold">{reportId || testResult.id.slice(-8).toUpperCase()}</span></p>
            <p className="text-sm text-gray-600">Report Date: <span className="font-semibold">{formatDate(new Date())}</span></p>
          </div>
          <div className="text-right">
            {hasCriticalValues && (
              <div className="bg-red-100 border border-red-400 text-red-800 px-3 py-2 rounded-lg">
                <p className="text-sm font-bold">⚠ CRITICAL VALUES ALERT</p>
                <p className="text-xs">Immediate clinical attention required</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Demographics */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          PATIENT DEMOGRAPHICS
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Patient ID:</span>
              <span className="font-mono text-primary font-bold">{patient.patientId}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Full Name:</span>
              <span className="font-semibold">{patient.surname}, {patient.givenName}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Date of Birth:</span>
              <span>{formatDate(patient.dateOfBirth)}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Age:</span>
              <span className="font-semibold">{calculateAge(patient.dateOfBirth)} years</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Gender:</span>
              <span>{patient.gender}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Phone:</span>
              <span>{patient.phoneNumber}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Address:</span>
              <span>{patient.address.village}, {patient.address.parish}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">District:</span>
              <span>{patient.address.district}</span>
            </div>
            {patient.referringDoctor && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-32">Referring Dr:</span>
                <span>{patient.referringDoctor}</span>
              </div>
            )}
            {patient.hospitalClinic && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-32">Hospital:</span>
                <span>{patient.hospitalClinic}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Information */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          TEST INFORMATION
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Test Name:</span>
              <span className="font-bold text-primary">{test.name}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Test Code:</span>
              <span className="font-mono">{test.code}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Sample Type:</span>
              <span>{test.sampleType}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Collection Date:</span>
              <span>{formatDate(testResult.testRequest?.sampleCollectionDate || testResult.datePerformed)}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Analysis Date:</span>
              <span>{formatDate(testResult.datePerformed)}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Report Date:</span>
              <span>{formatDate(testResult.dateApproved || new Date())}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-700 w-32">Priority:</span>
              <span className={`font-semibold ${
                patient.urgency === 'STAT' ? 'text-red-600' :
                patient.urgency === 'Urgent' ? 'text-orange-600' :
                'text-gray-600'
              }`}>
                {patient.urgency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Information */}
      {patient.clinicalHistory && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            CLINICAL INFORMATION
          </h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">{patient.clinicalHistory}</p>
          </div>
        </div>
      )}

      {/* Laboratory Results */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          LABORATORY RESULTS
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-4 py-3 text-left font-bold text-gray-900">
                  Parameter
                </th>
                <th className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-900">
                  Result
                </th>
                <th className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-900">
                  Unit
                </th>
                <th className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-900">
                  Reference Range
                </th>
                <th className="border border-gray-400 px-4 py-3 text-center font-bold text-gray-900">
                  Interpretation
                </th>
              </tr>
            </thead>
            <tbody>
              {testResult.resultValues.map((result, index) => {
                const interpretation = getResultInterpretation(result.flag);
                return (
                  <tr key={index} className={`${
                    result.flag === 'Critical' ? 'bg-red-50' :
                    result.flag === 'High' || result.flag === 'Low' ? 'bg-yellow-50' :
                    'hover:bg-gray-50'
                  }`}>
                    <td className="border border-gray-400 px-4 py-3 font-semibold text-gray-900">
                      {result.parameter}
                    </td>
                    <td className={`border border-gray-400 px-4 py-3 text-center font-bold text-lg ${interpretation.color}`}>
                      {interpretation.symbol} {result.value}
                    </td>
                    <td className="border border-gray-400 px-4 py-3 text-center text-gray-600">
                      {result.unit}
                    </td>
                    <td className="border border-gray-400 px-4 py-3 text-center text-sm text-gray-600">
                      {result.normalRange}
                    </td>
                    <td className={`border border-gray-400 px-4 py-3 text-center text-sm font-semibold ${interpretation.color}`}>
                      {interpretation.interpretation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Comments */}
      {testResult.remarks && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            CLINICAL COMMENTS
          </h3>
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-sm text-gray-800 font-medium">{testResult.remarks}</p>
          </div>
        </div>
      )}

      {/* Clinical Significance */}
      {hasAbnormalValues && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
            CLINICAL SIGNIFICANCE
          </h3>
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
            <p className="text-sm text-gray-800">
              This report contains values outside the normal reference ranges. 
              Clinical correlation is recommended. Please consult with the requesting physician 
              for proper interpretation and clinical management.
            </p>
            {hasCriticalValues && (
              <p className="text-sm text-red-800 font-semibold mt-2">
                ⚠ CRITICAL VALUES: This report contains critical values that require immediate 
                clinical attention. The requesting physician has been notified as per laboratory protocol.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quality Assurance */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
          QUALITY ASSURANCE
        </h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• All analyses performed using validated methods with appropriate quality control measures</p>
          <p>• Results are traceable to international reference standards where applicable</p>
          <p>• Internal quality control samples processed with patient specimens</p>
          <p>• Laboratory participates in external quality assurance programs</p>
        </div>
      </div>

      {/* Authorization */}
      <div className="border-t-2 border-gray-300 pt-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-gray-900 mb-3">PERFORMED BY</h4>
            <div className="space-y-2">
              <p className="font-semibold">{performedBy?.firstName} {performedBy?.lastName}</p>
              <p className="text-sm text-gray-600">Medical Laboratory Technologist</p>
              <p className="text-sm text-gray-600">Date: {formatDateTime(testResult.datePerformed)}</p>
              <div className="mt-4 border-b-2 border-gray-400 w-48 h-8"></div>
              <p className="text-xs text-gray-500">Digital Signature</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">AUTHORIZED BY</h4>
            <div className="space-y-2">
              <p className="font-semibold">{approvedBy?.firstName} {approvedBy?.lastName}</p>
              <p className="text-sm text-gray-600">Laboratory Director / Pathologist</p>
              <p className="text-sm text-gray-600">Date: {testResult.dateApproved ? formatDateTime(testResult.dateApproved) : 'Pending'}</p>
              <div className="mt-4 border-b-2 border-gray-400 w-48 h-8"></div>
              <p className="text-xs text-gray-500">Digital Signature</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-300">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>
              <p className="font-semibold mb-1">IMPORTANT NOTES:</p>
              <ul className="space-y-1">
                <li>• This report is electronically generated and valid without physical signature</li>
                <li>• Results should be interpreted in conjunction with clinical findings</li>
                <li>• Reference ranges may vary based on methodology and population</li>
                <li>• This report is confidential and intended only for authorized personnel</li>
              </ul>
            </div>
            <div className="text-right">
              <p>Page 1 of 1</p>
              <p>Generated: {formatDateTime(new Date())}</p>
              <p className="font-mono text-xs mt-1">ID: {reportId || testResult.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .print\\:max-w-none { max-width: none; }
          .print\\:shadow-none { box-shadow: none; }
          
          /* Page breaks */
          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          
          /* Hide non-essential elements */
          .no-print { display: none !important; }
          
          /* Optimize table printing */
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          
          /* Ensure colors print */
          * { -webkit-print-color-adjust: exact; color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}