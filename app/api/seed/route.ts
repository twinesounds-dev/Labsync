import { NextResponse } from 'next/server';
import { seedService } from '@/lib/seed-service';

export async function POST() {
  try {
    await seedService.seedAll();
    return NextResponse.json({ 
      success: true,
      message: 'Database seeded successfully',
      details: {
        facilities: 'Seeded 3 facilities',
        testCategories: 'Seeded 8 test categories',
        tests: 'Seeded 15 common tests',
        users: 'Seeded 4 default users'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
