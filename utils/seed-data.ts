import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { FACILITIES, TEST_CATEGORIES } from '@/lib/constants';
import { Facility, TestCategory, Test, TestNormalRange, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create Facilities
    console.log('Creating facilities...');
    const facilityIds: { [key: string]: string } = {};
    
    for (const facilityData of FACILITIES) {
      const facilityId = await firestoreService.create<Facility>(
        COLLECTIONS.FACILITIES,
        {
          ...facilityData,
          isActive: true,
        } as Partial<Facility>
      );
      facilityIds[facilityData.code] = facilityId;
      console.log(`✓ Created facility: ${facilityData.name}`);
    }

    // 2. Create Test Categories and Tests
    console.log('\nCreating test categories and tests...');
    let testCount = 0;
    
    for (let i = 0; i < TEST_CATEGORIES.length; i++) {
      const categoryData = TEST_CATEGORIES[i];
      
      // Create category
      const categoryId = await firestoreService.create<TestCategory>(
        COLLECTIONS.TEST_CATEGORIES,
        {
          name: categoryData.name,
          description: categoryData.description,
          order: i + 1,
          isActive: true,
        } as Partial<TestCategory>
      );
      
      console.log(`✓ Created category: ${categoryData.name}`);

      // Create tests for this category
      for (const testData of categoryData.tests) {
        const testDoc: Partial<Test> = {
          code: testData.code,
          name: testData.name,
          categoryId: categoryId,
          price: testData.price,
          turnaroundTime: testData.turnaroundTime,
          sampleType: testData.sampleType,
          containerType: testData.containerType,
          isActive: true,
        };
        
        // Only add storageRequirements if it exists
        if ('storageRequirements' in testData && testData.storageRequirements) {
          testDoc.storageRequirements = testData.storageRequirements;
        }
        
        const testId = await firestoreService.create<Test>(
          COLLECTIONS.TESTS,
          testDoc
        );

        // Create normal ranges for test parameters
        if (testData.parameters) {
          for (const param of testData.parameters) {
            const rangeDoc: Partial<TestNormalRange> = {
              testId: testId,
              parameter: param.parameter,
              unit: param.unit,
            };
            
            // Only add fields if they exist and are not undefined
            if ('normalRangeMale' in param && param.normalRangeMale) {
              rangeDoc.normalRangeMale = param.normalRangeMale;
            }
            if ('normalRangeFemale' in param && param.normalRangeFemale) {
              rangeDoc.normalRangeFemale = param.normalRangeFemale;
            }
            if ('normalRangeGeneral' in param && param.normalRangeGeneral) {
              rangeDoc.normalRangeGeneral = param.normalRangeGeneral;
            }
            
            await firestoreService.create<TestNormalRange>(
              COLLECTIONS.TEST_NORMAL_RANGES,
              rangeDoc
            );
          }
        }

        testCount++;
      }
    }
    
    console.log(`✓ Created ${testCount} tests`);

    // 3. Create Demo Users
    console.log('\nCreating demo users...');
    
    const demoUsers = [
      {
        id: 'demo-owner-1',
        email: 'owner@labsync.ug',
        firstName: 'John',
        lastName: 'Mugisha',
        role: 'owner' as const,
        facilityId: facilityIds['FLNT'],
        phone: '+256 700 000 100',
        isActive: true,
      },
      {
        id: 'demo-reception-ntungamo',
        email: 'reception.ntungamo@labsync.ug',
        firstName: 'Sarah',
        lastName: 'Nakato',
        role: 'receptionist' as const,
        facilityId: facilityIds['FLNT'],
        phone: '+256 700 000 101',
        isActive: true,
      },
      {
        id: 'demo-clerk-ntungamo',
        email: 'clerk.ntungamo@labsync.ug',
        firstName: 'David',
        lastName: 'Okello',
        role: 'clerk' as const,
        facilityId: facilityIds['FLNT'],
        phone: '+256 700 000 102',
        isActive: true,
      },
      {
        id: 'demo-labtech-ntungamo',
        email: 'labtech.ntungamo@labsync.ug',
        firstName: 'Grace',
        lastName: 'Namusoke',
        role: 'lab_tech' as const,
        facilityId: facilityIds['FLNT'],
        phone: '+256 700 000 103',
        isActive: true,
      },
      {
        id: 'demo-reception-mbarara',
        email: 'reception.mbarara@labsync.ug',
        firstName: 'Mary',
        lastName: 'Kwagala',
        role: 'receptionist' as const,
        facilityId: facilityIds['FLMB'],
        phone: '+256 700 000 104',
        isActive: true,
      },
      {
        id: 'demo-clerk-mbarara',
        email: 'clerk.mbarara@labsync.ug',
        firstName: 'Peter',
        lastName: 'Tumusiime',
        role: 'clerk' as const,
        facilityId: facilityIds['FLMB'],
        phone: '+256 700 000 105',
        isActive: true,
      },
      {
        id: 'demo-labtech-mbarara',
        email: 'labtech.mbarara@labsync.ug',
        firstName: 'Agnes',
        lastName: 'Nansubuga',
        role: 'lab_tech' as const,
        facilityId: facilityIds['FLMB'],
        phone: '+256 700 000 106',
        isActive: true,
      },
    ];

    for (const userData of demoUsers) {
      await firestoreService.create<User>(COLLECTIONS.USERS, userData as Partial<User>);
      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n✅ Database seeding completed successfully!');
    return { success: true, facilityIds };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Function to generate sample patients (to be called after authentication is set up)
export async function generateSamplePatients(facilityId: string, count: number = 10) {
  console.log(`Generating ${count} sample patients for facility ${facilityId}...`);
  
  const firstNames = ['John', 'Mary', 'David', 'Sarah', 'James', 'Grace', 'Peter', 'Agnes', 'Paul', 'Jane'];
  const lastNames = ['Mugisha', 'Nakato', 'Okello', 'Namusoke', 'Kwagala', 'Tumusiime', 'Nansubuga', 'Ssemakula', 'Namukasa', 'Kato'];
  const districts = ['Ntungamo', 'Mbarara', 'Kampala', 'Wakiso', 'Mukono'];
  
  for (let i = 0; i < count; i++) {
    const givenName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const surname = lastNames[Math.floor(Math.random() * lastNames.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    
    await firestoreService.create(COLLECTIONS.PATIENTS, {
      patientId: `DEMO-${String(i + 1).padStart(5, '0')}`,
      facilityId,
      registrationDate: new Date(),
      surname,
      givenName,
      dateOfBirth: new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      maritalStatus: ['Single', 'Married', 'Divorced', 'Widowed'][Math.floor(Math.random() * 4)],
      phoneNumber: `+256 7${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      address: {
        village: `${surname} Village`,
        parish: `${surname} Parish`,
        subCounty: `${surname} Sub-County`,
        district: district,
      },
      urgency: ['Routine', 'Urgent', 'STAT'][Math.floor(Math.random() * 3)] as 'Routine' | 'Urgent' | 'STAT',
      paymentType: ['Cash', 'Insurance', 'Corporate'][Math.floor(Math.random() * 3)] as 'Cash' | 'Insurance' | 'Corporate',
      isExternalReferral: Math.random() > 0.7,
      createdBy: 'demo-reception-ntungamo',
    });
  }
  
  console.log(`✓ Generated ${count} sample patients`);
}
Referral: Math.random() > 0.7,
      createdBy: 'demo-reception-ntungamo',
    });
  }
  
  console.log(`✓ Generated ${count} sample patients`);
}
