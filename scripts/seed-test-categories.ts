import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

const testCategories = [
  {
    name: 'Hematology',
    description: 'Blood-related tests',
    order: 1,
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    name: 'Clinical Chemistry',
    description: 'Chemical analysis tests',
    order: 2,
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    name: 'Microbiology',
    description: 'Bacterial and viral tests',
    order: 3,
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    name: 'Serology',
    description: 'Antibody and antigen tests',
    order: 4,
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    name: 'Parasitology',
    description: 'Parasite detection tests',
    order: 5,
    isActive: true,
    createdAt: Timestamp.now(),
  },
  {
    name: 'Urinalysis',
    description: 'Urine analysis tests',
    order: 6,
    isActive: true,
    createdAt: Timestamp.now(),
  },
];

async function seedTestCategories() {
  try {
    const categoriesCollection = collection(db, 'test_categories');
    
    for (const category of testCategories) {
      await addDoc(categoriesCollection, category);
      console.log(`Added category: ${category.name}`);
    }
    
    console.log('Test categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding test categories:', error);
  }
}

seedTestCategories();
