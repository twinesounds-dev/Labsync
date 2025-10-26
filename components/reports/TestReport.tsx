'use client';

import { TestResult, TestRequest, Patient, Facility } from '@/types';
import { format } from 'date-fns';
import { 
  Download, 
  Printer, 
  FileText, 
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Shield
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface TestReportProps {
  result: TestResult;
  request: TestRequest;
  patient: Patient;
  facility?: Facility;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function TestReport({ 
  result, 
  request, 
  patient, 
  facility,
  onPrint,
  onDownload 
}: TestReportProps) {

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getResultInterpretation = () => {
    const criticalValues = result.resultValues?.filter(v => v.flag === 'Critical') || [];
    const abnormalValues = result.resultValues?.filter(v => v.flag === 'High' || v.flag === 'Low') || [];
    
    if (criticalValues.length > 0) {
      return {
        status: 'Critical',
        message: 'CRITICAL VALUES DETECTED - Immediate medical attention required',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else if (abnormalValues.length > 0) {
      return {
        status: 'Abnormal',
        message: 'Some values are outside normal range - Please consult with physician',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    } else {
      return {
        status: 'Normal',
        message: 'All values are within normal limits',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }
  };

  const interpretation = getResultInterpretation();

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Report Header */}
      <div className="border-b-2 border-primary pb-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              LABORATORY TEST REPORT
            </h1>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Report ID: {result.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Report Date: {format(new Date(), 'dd MMMM yyyy, HH:mm')}</span>
              </div>
            </div>
          </div>
          
          {facility && (
            <div className="text-right">
              <h2 className="text-lg font-semibold text-primary">{facility.name}</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center justify-end space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{facility.address}</span>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{facility.phone}</span>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{facility.email}</span>
                </div>
                <div className="text-xs">
                  License: {facility.licenseNumber}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Information */}
      <Card title="Patient Information" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm text-gray-600">Patient Name:</span>
                <div className="font-semibold">{patient.surname}, {patient.givenName}</div>
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Patient ID:</span>
              <div className="font-semibold">{patient.patientId}</div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Date of Birth:</span>
              <div className="font-semibold">
                {format(patient.dateOfBirth, 'dd MMMM yyyy')} 
                <span className="text-gray-500 ml-2">({calculateAge(patient.dateOfBirth)} years)</span>
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Gender:</span>
              <div className="font-semibold">{patient.gender}</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <div className="font-semibold">{patient.phoneNumber}</div>
              </div>
            </div>
            
            <div>
              <span className="text-sm text-gray-600">Address:</span>
              <div className="font-semibold">
                {patient.address.village}, {patient.address.parish}<br />
                {patient.address.subCounty}, {patient.address.district}
              </div>
            </div>
            
            {patient.referringDoctor && (
              <div>
                <span className="text-sm text-gray-600">Referring Doctor:</span>
                <div className="font-semibold">{patient.referringDoctor}</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Test Information */}
      <Card title="Test Information" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-sm text-gray-600">Test Name:</span>
            <div className="font-semibold">{result.test?.name}</div>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Test Code:</span>
            <div className="font-semibold">{result.test?.code}</div>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Sample Type:</span>
            <div className="font-semibold">{result.test?.sampleType}</div>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Collection Date:</span>
            <div className="font-semibold">
              {request.sampleReceivedDate ? format(request.sampleReceivedDate, 'dd MMM yyyy, HH:mm') : 'N/A'}
            </div>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Analysis Date:</span>
            <div className="font-semibold">
              {format(result.datePerformed, 'dd MMM yyyy, HH:mm')}
            </div>
          </div>
          
          <div>
            <span className="text-sm text-gray-600">Report Date:</span>
            <div className="font-semibold">
              {format(new Date(), 'dd MMM yyyy, HH:mm')}
            </div>
          </div>
        </div>
      </Card>

      {/* Clinical Information */}
      {(request.clerkNotes || patient.clinicalHistory) && (
        <Card title="Clinical Information" className="mb-6">
          {patient.clinicalHistory && (
            <div className="mb-4">
              <span className="text-sm text-gray-600 font-medium">Clinical History:</span>
              <div className="mt-1 p-3 bg-blue-50 rounded-lg text-sm">
                {patient.clinicalHistory}
              </div>
            </div>
          )}
          
          {request.clerkNotes && (
            <div>
              <span className="text-sm text-gray-600 font-medium">Collection Notes:</span>
              <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                {request.clerkNotes}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Test Results */}
      <Card title="Laboratory Results" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Parameter</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Result</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Unit</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Reference Range</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Flag</th>
              </tr>
            </thead>
            <tbody>
              {result.resultValues?.map((value, index) => (
                <tr key={index} className={`border-b border-gray-100 ${
                  value.flag === 'High' || value.flag === 'Critical' || value.flag === 'Low' 
                    ? 'bg-yellow-50' 
                    : ''
                }`}>
                  <td className="py-3 px-2 font-medium">{value.parameter}</td>
                  <td className={`py-3 px-2 font-semibold ${
                    value.flag === 'High' || value.flag === 'Critical' 
                      ? 'text-red-600' 
                      : value.flag === 'Low' 
                        ? 'text-orange-600'
                        : 'text-gray-900'
                  }`}>
                    {value.value}
                  </td>
                  <td className="py-3 px-2">{value.unit}</td>
                  <td className="py-3 px-2">{value.normalRange || 'N/A'}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      value.flag === 'High' || value.flag === 'Critical' 
                        ? 'bg-red-100 text-red-800' 
                        : value.flag === 'Low' 
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {value.flag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Result Interpretation */}
      <Card title="Result Interpretation" className={`mb-6 ${interpretation.borderColor}`}>
        <div className={`p-4 rounded-lg ${interpretation.bgColor}`}>
          <div className="flex items-start space-x-3">
            {interpretation.status === 'Critical' ? (
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${interpretation.color}`} />
            ) : interpretation.status === 'Abnormal' ? (
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${interpretation.color}`} />
            ) : (
              <CheckCircle className={`w-5 h-5 mt-0.5 ${interpretation.color}`} />
            )}
            <div>
              <h4 className={`font-semibold ${interpretation.color}`}>
                {interpretation.status} Results
              </h4>
              <p className={`text-sm ${interpretation.color} mt-1`}>
                {interpretation.message}
              </p>
            </div>
          </div>
        </div>

        {result.remarks && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-1">Laboratory Comments:</h5>
            <p className="text-sm text-gray-700">{result.remarks}</p>
          </div>
        )}
      </Card>

      {/* Quality Assurance */}
      <Card title="Quality Assurance" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Analysis Information</h5>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Performed by:</span>
                <span className="ml-2 font-medium">{result.performedBy}</span>
              </div>
              <div>
                <span className="text-gray-600">Analysis date:</span>
                <span className="ml-2 font-medium">
                  {format(result.datePerformed, 'dd MMM yyyy, HH:mm')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Approved by:</span>
                <span className="ml-2 font-medium">{result.approvedBy || 'Pending'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Quality Control</h5>
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-green-700">Quality standards met</span>
            </div>
            <div className="flex items-center space-x-2 text-sm mt-1">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">ISO 15189 compliant</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Important Notes */}
      <Card title="Important Notes" className="mb-6">
        <div className="space-y-2 text-sm text-gray-700">
          <p>• This report is valid only with the laboratory seal and authorized signature.</p>
          <p>• Results should be interpreted in conjunction with clinical findings.</p>
          <p>• For any queries regarding this report, please contact the laboratory.</p>
          <p>• Critical values have been communicated to the requesting physician.</p>
          <p>• Reference ranges may vary based on methodology and population.</p>
        </div>
      </Card>

      {/* Footer */}
      <div className="border-t pt-6 mt-8">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Report generated on: {format(new Date(), 'dd MMMM yyyy \'at\' HH:mm')}</p>
            <p>This is a computer-generated report and does not require a signature.</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </Button>
            
            <Button
              size="sm"
              onClick={onPrint}
              className="flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Report</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}