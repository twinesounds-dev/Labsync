'use client';

import { useState, useEffect } from 'react';
import { TestRequest, TestResult } from '@/types';
import { format } from 'date-fns';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TestTube, 
  FileText,
  User,
  Calendar,
  Zap,
  Shield,
  Printer,
  Eye
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface TrackingStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending' | 'skipped';
  timestamp?: Date;
  performedBy?: string;
  notes?: string;
  icon: React.ReactNode;
}

interface SampleTrackerProps {
  request: TestRequest;
  results?: TestResult[];
  onViewDetails?: () => void;
}

export default function SampleTracker({ request, results, onViewDetails }: SampleTrackerProps) {
  const [trackingSteps, setTrackingSteps] = useState<TrackingStep[]>([]);

  useEffect(() => {
    const steps: TrackingStep[] = [
      {
        id: 'registration',
        title: 'Patient Registration',
        description: 'Patient registered and tests selected',
        status: 'completed',
        timestamp: request.requestDate,
        performedBy: request.requestedBy,
        icon: <User className="w-5 h-5" />
      },
      {
        id: 'payment',
        title: 'Payment Confirmation',
        description: 'Payment processed and confirmed',
        status: request.paymentStatus === 'Paid' ? 'completed' : 'pending',
        timestamp: request.paymentStatus === 'Paid' ? request.requestDate : undefined,
        icon: <CheckCircle className="w-5 h-5" />
      },
      {
        id: 'sample_collection',
        title: 'Sample Collection',
        description: 'Samples collected and quality checked',
        status: request.sampleReceivedDate ? 'completed' : 
                request.paymentStatus === 'Paid' ? 'current' : 'pending',
        timestamp: request.sampleReceivedDate,
        performedBy: request.sampleReceivedBy,
        notes: request.sampleQualityNotes,
        icon: <TestTube className="w-5 h-5" />
      },
      {
        id: 'lab_analysis',
        title: 'Laboratory Analysis',
        description: 'Tests performed and results generated',
        status: results && results.length > 0 ? 'completed' : 
                request.sampleReceivedDate ? 'current' : 'pending',
        timestamp: results?.[0]?.datePerformed,
        performedBy: results?.[0]?.performedBy,
        notes: results?.[0]?.remarks,
        icon: <Shield className="w-5 h-5" />
      },
      {
        id: 'quality_review',
        title: 'Quality Review',
        description: 'Results reviewed and approved',
        status: results?.every(r => r.status === 'Approved') ? 'completed' :
                results?.some(r => r.status === 'Submitted') ? 'current' : 'pending',
        timestamp: results?.find(r => r.status === 'Approved')?.dateApproved,
        performedBy: results?.find(r => r.status === 'Approved')?.approvedBy,
        icon: <Eye className="w-5 h-5" />
      },
      {
        id: 'report_generation',
        title: 'Report Generation',
        description: 'Final report prepared for delivery',
        status: results?.every(r => r.status === 'Approved') ? 'completed' : 'pending',
        timestamp: results?.every(r => r.status === 'Approved') ? new Date() : undefined,
        icon: <FileText className="w-5 h-5" />
      },
      {
        id: 'report_delivery',
        title: 'Report Delivery',
        description: 'Report printed and delivered to patient',
        status: results?.some(r => r.status === 'Printed') ? 'completed' : 'pending',
        timestamp: results?.find(r => r.status === 'Printed')?.updatedAt,
        icon: <Printer className="w-5 h-5" />
      }
    ];

    setTrackingSteps(steps);
  }, [request, results]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'current': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-400 bg-gray-100';
      case 'skipped': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-400 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'current': return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'skipped': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCurrentStep = () => {
    return trackingSteps.find(step => step.status === 'current');
  };

  const getCompletionPercentage = () => {
    const completed = trackingSteps.filter(step => step.status === 'completed').length;
    return Math.round((completed / trackingSteps.length) * 100);
  };

  const getEstimatedCompletion = () => {
    const currentStep = getCurrentStep();
    if (!currentStep) return 'Completed';

    const estimatedTimes = {
      'payment': '5 minutes',
      'sample_collection': '15 minutes',
      'lab_analysis': '2-4 hours',
      'quality_review': '30 minutes',
      'report_generation': '5 minutes',
      'report_delivery': 'Ready for pickup'
    };

    return estimatedTimes[currentStep.id as keyof typeof estimatedTimes] || 'Processing';
  };

  return (
    <div className="space-y-6">
      {/* Header with Patient Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Sample Tracking: {request.patient?.surname} {request.patient?.givenName}
            </h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>ID: {request.patient?.patientId}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Requested: {format(request.requestDate, 'dd MMM yyyy, HH:mm')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TestTube className="w-4 h-4" />
                <span>{request.tests.length} test(s)</span>
              </div>
              {request.patient?.urgency === 'STAT' && (
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-red-500" />
                  <span className="text-red-600 font-medium">STAT Priority</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{getCompletionPercentage()}%</div>
            <div className="text-sm text-gray-600">Complete</div>
            {onViewDetails && (
              <Button
                size="sm"
                onClick={onViewDetails}
                className="mt-2"
              >
                View Details
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>ETA: {getEstimatedCompletion()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Tracking Steps */}
      <Card title="Tracking Timeline">
        <div className="space-y-6">
          {trackingSteps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {index < trackingSteps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              <div className="flex items-start space-x-4">
                {/* Step Icon */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 
                  ${step.status === 'completed' ? 'border-green-300 bg-green-50' :
                    step.status === 'current' ? 'border-blue-300 bg-blue-50' :
                    'border-gray-300 bg-gray-50'}
                `}>
                  <div className={
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'current' ? 'text-blue-600' :
                    'text-gray-400'
                  }>
                    {step.icon}
                  </div>
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'current' ? 'text-blue-900' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(step.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                        {step.status === 'current' ? 'In Progress' : 
                         step.status === 'completed' ? 'Completed' : 
                         step.status === 'pending' ? 'Pending' : 'Skipped'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  
                  {/* Step Details */}
                  {(step.timestamp || step.performedBy || step.notes) && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                        {step.timestamp && (
                          <div>
                            <span className="font-medium">Time:</span>
                            <div>{format(step.timestamp, 'dd MMM yyyy, HH:mm')}</div>
                          </div>
                        )}
                        {step.performedBy && (
                          <div>
                            <span className="font-medium">Performed by:</span>
                            <div>{step.performedBy}</div>
                          </div>
                        )}
                        {step.notes && (
                          <div className="md:col-span-1">
                            <span className="font-medium">Notes:</span>
                            <div>{step.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Test Details */}
      <Card title="Test Information">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {request.tests.map((test, index) => {
            const testResult = results?.find(r => r.testId === test.testId);
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{test.test?.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    testResult?.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    testResult?.status === 'Submitted' ? 'bg-blue-100 text-blue-800' :
                    test.status === 'Completed' ? 'bg-orange-100 text-orange-800' :
                    test.status === 'InProgress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {testResult?.status || test.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Code: {test.test?.code}</div>
                  <div>Sample: {test.test?.sampleType}</div>
                  <div>Price: UGX {test.price.toLocaleString()}</div>
                  {testResult?.datePerformed && (
                    <div>Performed: {format(testResult.datePerformed, 'dd MMM HH:mm')}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Current Status Alert */}
      {getCurrentStep() && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
            <div>
              <h4 className="font-semibold text-blue-900">Current Status</h4>
              <p className="text-blue-800 text-sm">
                {getCurrentStep()?.description} - Estimated completion: {getEstimatedCompletion()}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}