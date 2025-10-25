import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

const testCategories = [
  {
    name: 'Hematology',
    description: 'Blood-related tests',
    order: 1,
    isActive: true,
  },
  {
    name: 'Clinical Chemistry',
    description: 'Chemical analysis tests',
    order: 2,
    isActive: true,
  },
  {
    name: 'Microbiology',
    description: 'Bacterial and viral tests',
    order: 3,
    isActive: true,
  },
  {
    name: 'Serology',
    description: 'Antibody and antigen tests',
    order: 4,
    isActive: true,
  },
  {
    name: 'Parasitology',
    description: 'Parasite detection tests',
    order: 5,
    isActive: true,
  },
  {
    name: 'Urinalysis',
    description: 'Urine analysis tests',
    order: 6,
    isActive: true,
  },
];

export async function GET() {
  try {
    const categoriesCollection = collection(db, 'test_categories');
    
    // Check if categories already exist
    const existingCategories = await getDocs(categoriesCollection);
    
    if (existingCategories.size > 0) {
      return NextResponse.json({
        message: 'Test categories already exist',
        count: existingCategories.size,
      });
    }
    
    // Add categories
    const addedCategories = [];
    for (const category of testCategories) {
      const docRef = await addDoc(categoriesCollection, {
        ...category,
        createdAt: Timestamp.now(),
      });
      addedCategories.push({ id: docRef.id, ...category });
    }
    
    return NextResponse.json({
      message: 'Test categories seeded successfully',
      categories: addedCategories,
    });
  } catch (error) {
    console.error('Error seeding test categories:', error);
    return NextResponse.json(
      { error: 'Failed to seed test categories' },
      { status: 500 }
    );
  }
}
