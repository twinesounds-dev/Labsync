import { NextResponse } from 'next/server';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { TestResult, Patient, Test, TestRequest, User } from '@/types';

export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('🧪 Seeding test results for testing...');

    // Get some existing data to work with
    const patients = await firestoreService.getAll<Patient>(COLLECTIONS.PATIENTS);
    const tests = await firestoreService.getAll<Test>(COLLECTIONS.TESTS);
    const users = await firestoreService.getAll<User>(COLLECTIONS.USERS);
    const testRequests = await firestoreService.getAll<TestRequest>(COLLECTIONS.TEST_REQUESTS);

    if (patients.length === 0 || tests.length === 0 || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Please seed basic data first (patients, tests, users)'
      }, { status: 400 });
    }

    // Find a lab tech user
    const labTech = users.find(u => u.role === 'lab_tech');
    if (!labTech) {
      return NextResponse.json({
        success: false,
        error: 'No lab tech user found. Please create users first.'
      }, { status: 400 });
    }

    const createdResults = [];

    // Create some sample test results
    for (let i = 0; i < Math.min(3, patients.length, tests.length); i++) {
      const patient = patients[i];
      const test = tests[i];
      
      // Create a test request if none exists for this patient
      let testRequest = testRequests.find(tr => tr.patientId === patient.id);
      if (!testRequest) {
        const testRequestId = await firestoreService.create<TestRequest>(COLLECTIONS.TEST_REQUESTS, {
          patientId: patient.id,
          facilityId: patient.facilityId,
          requestDate: new Date(),
          requestedBy: labTech.id,
          tests: [{
            testId: test.id,
            status: 'Completed',
            price: test.price,
          }],
          paymentStatus: 'Paid',
          overallStatus: 'Completed',
          sampleCollectionDate: new Date(),
          sampleReceivedDate: new Date(),
          sampleReceivedBy: labTech.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Partial<TestRequest>);

        testRequest = {
          id: testRequestId,
          patientId: patient.id,
          facilityId: patient.facilityId,
        } as TestRequest;
      }

      // Generate sample result values based on test type
      const resultValues = [];
      if (test.code === 'FBC') {
        resultValues.push(
          { parameter: 'Hemoglobin', value: '12.5', unit: 'g/dL', normalRange: '12.0-15.0', flag: 'Normal' },
          { parameter: 'WBC Count', value: '8500', unit: 'cells/μL', normalRange: '4,000-11,000', flag: 'Normal' },
          { parameter: 'RBC Count', value: '4.2', unit: 'million/μL', normalRange: '4.0-5.0', flag: 'Normal' },
          { parameter: 'Platelet Count', value: '250000', unit: 'cells/μL', normalRange: '150,000-400,000', flag: 'Normal' }
        );
      } else if (test.code === 'GLUC') {
        resultValues.push(
          { parameter: 'Glucose (Fasting)', value: '95', unit: 'mg/dL', normalRange: '70-100', flag: 'Normal' }
        );
      } else {
        // Generic result
        resultValues.push(
          { parameter: test.name, value: 'Normal', unit: '', normalRange: 'Normal', flag: 'Normal' }
        );
      }

      // Create the test result
      const resultId = await firestoreService.create<TestResult>(COLLECTIONS.TEST_RESULTS, {
        testRequestId: testRequest.id,
        testId: test.id,
        patientId: patient.id,
        facilityId: patient.facilityId,
        resultValues,
        remarks: `Sample test result for ${test.name}`,
        datePerformed: new Date(),
        dateSubmitted: new Date(),
        performedBy: labTech.id,
        status: 'Submitted',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Partial<TestResult>);

      createdResults.push({
        resultId,
        patientId: patient.patientId,
        testName: test.name,
        facilityId: patient.facilityId,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdResults.length} test results for approval testing`,
      data: createdResults
    });

  } catch (error) {
    console.error('Error seeding test results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}