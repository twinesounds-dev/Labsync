import { NextResponse } from 'next/server';
import { seedDatabase } from '@/utils/seed-data';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
