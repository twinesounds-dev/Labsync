#!/usr/bin/env node

/**
 * Firebase Database Seeding Script
 * Run this after setting up Firebase to populate initial data
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Note: You'll need to download your service account key from Firebase Console
// and set GOOGLE_APPLICATION_CREDENTIALS environment variable

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('❌ Please set GOOGLE_APPLICATION_CREDENTIALS environment variable');
  console.error('   pointing to your Firebase service account JSON file');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

const FACILITIES = [
  {
    code: 'FLNT',
    name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO',
    address: 'Ntungamo District, Uganda',
    phone: '+256 700 000 001',
    email: 'ntungamo@firstlinelab.ug',
    licenseNumber: 'LAB-UG-2024-001',
    isActive: true,
  },
  {
    code: 'FLMB',
    name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - MBARARA',
    address: 'Mbarara District, Uganda',
    phone: '+256 700 000 002',
    email: 'mbarara@firstlinelab.ug',
    licenseNumber: 'LAB-UG-2024-002',
    isActive: true,
  },
  {
    code: 'PCMC',
    name: 'PRIMECURE MEDICAL CENTRE',
    address: 'Kampala, Uganda',
    phone: '+256 700 000 003',
    email: 'info@primecuremedical.ug',
    licenseNumber: 'LAB-UG-2024-003',
    isActive: true,
  },
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create facilities
    console.log('Creating facilities...');
    const facilityIds = {};

    for (const facility of FACILITIES) {
      const docRef = await db.collection('facilities').add({
        ...facility,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      facilityIds[facility.code] = docRef.id;
      console.log(`✅ Created facility: ${facility.name}`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit your Firebase Console');
    console.log('2. Go to Authentication > Users');
    console.log('3. Manually create users with the following emails:');
    console.log('   - owner@labsync.ug (role: owner)');
    console.log('   - reception.ntungamo@labsync.ug (role: receptionist)');
    console.log('   - clerk.ntungamo@labsync.ug (role: clerk)');
    console.log('   - labtech.ntungamo@labsync.ug (role: lab_tech)');
    console.log('4. Then create corresponding user documents in Firestore');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
