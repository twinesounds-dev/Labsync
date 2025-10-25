import { NextRequest, NextResponse } from 'next/server';
import { testService, facilityService, testCategoryService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Create a default facility first
    const facility = {
      name: 'Default Lab Facility',
      code: 'LAB',
      address: '123 Lab Street, Kampala, Uganda',
      phone: '+256 700 000 000',
      email: 'info@labfacility.com',
      isActive: true,
    };

    const facilityId = await facilityService.create(facility);
    console.log('Created facility:', facilityId);

    // Try to create a simple test first
    const simpleTest = {
      categoryId: 'hematology',
      name: 'Simple Test',
      code: 'ST',
      price: 1000,
      turnaroundTime: '1 hour',
      sampleType: 'Blood',
      storageRequirements: 'Room temperature',
      containerType: 'EDTA Tube',
      normalRanges: [],
      isActive: true,
    };

    console.log('Creating simple test with data:', JSON.stringify(simpleTest, null, 2));
    
    const testId = await testService.create(simpleTest);
    console.log('Created simple test:', testId);

    return NextResponse.json({
      success: true,
      message: 'Simple test created successfully',
      facilityId,
      testId,
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}