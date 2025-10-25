import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface SeedResults {
  facilities: Array<{ id: string; [key: string]: unknown }>;
  categories: Array<{ id: string; [key: string]: unknown }>;
  users: Array<{ id: string; email: string; role: string }>;
  message: string;
}

export async function POST() {
  try {
    const results: SeedResults = {
      facilities: [],
      categories: [],
      users: [],
      message: 'Initial data seeded successfully',
    };

    // 1. Seed Facilities
    const facilitiesCollection = collection(db, 'facilities');
    const existingFacilities = await getDocs(facilitiesCollection);
    
    if (existingFacilities.size === 0) {
      const facilities = [
        {
          name: 'FIRSTLINE - NTUNGAMO',
          code: 'FLNT',
          address: 'Plot 123, Main Street, Ntungamo District',
          phone: '+256 700 123 456',
          email: 'ntungamo@firstlinelabs.ug',
          licenseNumber: 'UG-LAB-2024-FLNT',
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          name: 'FIRSTLINE - MBARARA',
          code: 'FLMB',
          address: 'High Street, Mbarara City',
          phone: '+256 700 234 567',
          email: 'mbarara@firstlinelabs.ug',
          licenseNumber: 'UG-LAB-2024-FLMB',
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        {
          name: 'PRIMECURE MEDICAL',
          code: 'PCMC',
          address: 'Medical Plaza, Kampala',
          phone: '+256 700 345 678',
          email: 'info@primecure.ug',
          licenseNumber: 'UG-LAB-2024-PCMC',
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ];

      for (const facility of facilities) {
        const docRef = await addDoc(facilitiesCollection, facility);
        results.facilities.push({ id: docRef.id, ...facility });
      }
    }

    // 2. Seed Test Categories
    const categoriesCollection = collection(db, 'test_categories');
    const existingCategories = await getDocs(categoriesCollection);
    
    if (existingCategories.size === 0) {
      const categories = [
        { name: 'Hematology', description: 'Blood-related tests', order: 1, isActive: true },
        { name: 'Clinical Chemistry', description: 'Chemical analysis tests', order: 2, isActive: true },
        { name: 'Microbiology', description: 'Bacterial and viral tests', order: 3, isActive: true },
        { name: 'Serology', description: 'Antibody and antigen tests', order: 4, isActive: true },
        { name: 'Parasitology', description: 'Parasite detection tests', order: 5, isActive: true },
        { name: 'Urinalysis', description: 'Urine analysis tests', order: 6, isActive: true },
      ];

      for (const category of categories) {
        const docRef = await addDoc(categoriesCollection, {
          ...category,
          createdAt: Timestamp.now(),
        });
        results.categories.push({ id: docRef.id, ...category });
      }
    }

    // 3. Seed Demo Users (if facilities exist)
    const facilitiesList = await getDocs(facilitiesCollection);
    if (facilitiesList.size > 0) {
      const firstFacilityId = facilitiesList.docs[0].id;
      
      const demoUsers = [
        {
          email: 'owner@labsync.ug',
          password: 'password123',
          firstName: 'Admin',
          lastName: 'Owner',
          role: 'owner' as const,
          phone: '+256 700 000 001',
        },
        {
          email: 'reception@labsync.ug',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Receptionist',
          role: 'receptionist' as const,
          phone: '+256 700 000 002',
        },
        {
          email: 'clerk@labsync.ug',
          password: 'password123',
          firstName: 'John',
          lastName: 'Clerk',
          role: 'clerk' as const,
          phone: '+256 700 000 003',
        },
        {
          email: 'labtech@labsync.ug',
          password: 'password123',
          firstName: 'Sarah',
          lastName: 'Technician',
          role: 'lab_tech' as const,
          phone: '+256 700 000 004',
        },
      ];

      for (const userData of demoUsers) {
        try {
          // Check if user already exists
          const usersCollection = collection(db, 'users');
          const existingUsers = await getDocs(usersCollection);
          const userExists = existingUsers.docs.some(
            (doc) => doc.data().email === userData.email
          );

          if (!userExists) {
            const userCredential = await createUserWithEmailAndPassword(
              auth,
              userData.email,
              userData.password
            );

            const userDoc = doc(db, 'users', userCredential.user.uid);
            await setDoc(userDoc, {
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role,
              facilityId: firstFacilityId,
              phone: userData.phone,
              isActive: true,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });

            results.users.push({
              id: userCredential.user.uid,
              email: userData.email,
              role: userData.role,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`User ${userData.email} may already exist:`, errorMessage);
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error seeding initial data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to seed initial data', details: errorMessage },
      { status: 500 }
    );
  }
}
