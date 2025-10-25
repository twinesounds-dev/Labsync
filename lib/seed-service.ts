import { firestoreService, COLLECTIONS } from './firestore';
import { userService } from './user-service';
import { Facility, Test, TestCategory } from '@/types';

export const seedService = {
  async seedFacilities(): Promise<void> {
    try {
      const facilities = [
        {
          name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO',
          code: 'FLNT',
          address: 'Ntungamo District, Uganda',
          phone: '+256 700 000 001',
          email: 'ntungamo@firstlinelab.ug',
          licenseNumber: 'LAB-UG-2024-001',
          isActive: true,
        },
        {
          name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - MBARARA',
          code: 'FLMB',
          address: 'Mbarara District, Uganda',
          phone: '+256 700 000 002',
          email: 'mbarara@firstlinelab.ug',
          licenseNumber: 'LAB-UG-2024-002',
          isActive: true,
        },
        {
          name: 'PRIMECURE MEDICAL CENTRE',
          code: 'PCMC',
          address: 'Kampala, Uganda',
          phone: '+256 700 000 003',
          email: 'info@primecuremedical.ug',
          licenseNumber: 'LAB-UG-2024-003',
          isActive: true,
        },
      ];

      for (const facility of facilities) {
        await firestoreService.create<Facility>(COLLECTIONS.FACILITIES, facility);
      }

      console.log('Facilities seeded successfully');
    } catch (error) {
      console.error('Error seeding facilities:', error);
    }
  },

  async seedTestCategories(): Promise<void> {
    try {
      const categories = [
        { name: 'HEMATOLOGY', description: 'Blood-related tests', order: 1, isActive: true },
        { name: 'BIOCHEMISTRY', description: 'Chemical analysis tests', order: 2, isActive: true },
        { name: 'MICROBIOLOGY', description: 'Infection and organism tests', order: 3, isActive: true },
        { name: 'SEROLOGY', description: 'Immune system tests', order: 4, isActive: true },
        { name: 'HORMONES', description: 'Endocrine system tests', order: 5, isActive: true },
        { name: 'IMMUNOLOGY', description: 'Immune response tests', order: 6, isActive: true },
        { name: 'MOLECULAR', description: 'DNA/RNA tests', order: 7, isActive: true },
        { name: 'HISTOPATHOLOGY', description: 'Tissue examination', order: 8, isActive: true },
      ];

      for (const category of categories) {
        await firestoreService.create<TestCategory>(COLLECTIONS.TEST_CATEGORIES, category);
      }

      console.log('Test categories seeded successfully');
    } catch (error) {
      console.error('Error seeding test categories:', error);
    }
  },

  async seedCommonTests(): Promise<void> {
    try {
      const tests = [
        {
          code: 'HEM001',
          name: 'Complete Blood Count (CBC)',
          category: 'HEMATOLOGY',
          price: 25000,
          turnaroundTime: '2 hours',
          sampleType: 'Blood',
          containerType: 'EDTA Tube',
          storageRequirements: 'Store at room temperature, process within 6 hours',
          isActive: true,
        },
        {
          code: 'HEM002',
          name: 'Hemoglobin Level',
          category: 'HEMATOLOGY',
          price: 15000,
          turnaroundTime: '1 hour',
          sampleType: 'Blood',
          containerType: 'EDTA Tube',
          storageRequirements: 'Store at room temperature, process within 6 hours',
          isActive: true,
        },
        {
          code: 'BIO001',
          name: 'Fasting Blood Sugar (FBS)',
          category: 'BIOCHEMISTRY',
          price: 15000,
          turnaroundTime: '1 hour',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Process within 2 hours or refrigerate',
          isActive: true,
        },
        {
          code: 'BIO002',
          name: 'Random Blood Sugar (RBS)',
          category: 'BIOCHEMISTRY',
          price: 12000,
          turnaroundTime: '30 minutes',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Process within 2 hours or refrigerate',
          isActive: true,
        },
        {
          code: 'BIO003',
          name: 'Liver Function Test (LFT)',
          category: 'BIOCHEMISTRY',
          price: 35000,
          turnaroundTime: '4 hours',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Process within 4 hours or refrigerate',
          isActive: true,
        },
        {
          code: 'BIO004',
          name: 'Kidney Function Test (KFT)',
          category: 'BIOCHEMISTRY',
          price: 30000,
          turnaroundTime: '4 hours',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Process within 4 hours or refrigerate',
          isActive: true,
        },
        {
          code: 'MIC001',
          name: 'Malaria Test (Rapid)',
          category: 'MICROBIOLOGY',
          price: 10000,
          turnaroundTime: '15 minutes',
          sampleType: 'Blood',
          containerType: 'EDTA Tube',
          storageRequirements: 'Test immediately or store at room temperature',
          isActive: true,
        },
        {
          code: 'MIC002',
          name: 'Malaria Microscopy',
          category: 'MICROBIOLOGY',
          price: 15000,
          turnaroundTime: '1 hour',
          sampleType: 'Blood',
          containerType: 'EDTA Tube',
          storageRequirements: 'Prepare smears immediately',
          isActive: true,
        },
        {
          code: 'MIC003',
          name: 'Stool Analysis',
          category: 'MICROBIOLOGY',
          price: 20000,
          turnaroundTime: '2 hours',
          sampleType: 'Stool',
          containerType: 'Stool Container',
          storageRequirements: 'Process within 2 hours of collection',
          isActive: true,
        },
        {
          code: 'MIC004',
          name: 'Urine Analysis',
          category: 'MICROBIOLOGY',
          price: 18000,
          turnaroundTime: '1 hour',
          sampleType: 'Urine',
          containerType: 'Urine Container',
          storageRequirements: 'Process within 2 hours or refrigerate',
          isActive: true,
        },
        {
          code: 'SER001',
          name: 'HIV Test (Rapid)',
          category: 'SEROLOGY',
          price: 20000,
          turnaroundTime: '30 minutes',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Test immediately or store at 2-8°C',
          isActive: true,
        },
        {
          code: 'SER002',
          name: 'Hepatitis B Surface Antigen',
          category: 'SEROLOGY',
          price: 25000,
          turnaroundTime: '1 hour',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Store at 2-8°C if not tested immediately',
          isActive: true,
        },
        {
          code: 'SER003',
          name: 'Hepatitis C Test',
          category: 'SEROLOGY',
          price: 30000,
          turnaroundTime: '1 hour',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Store at 2-8°C if not tested immediately',
          isActive: true,
        },
        {
          code: 'HOR001',
          name: 'Thyroid Function Test (TSH, T3, T4)',
          category: 'HORMONES',
          price: 45000,
          turnaroundTime: '24 hours',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Store at 2-8°C',
          isActive: true,
        },
        {
          code: 'HOR002',
          name: 'Pregnancy Test (Beta HCG)',
          category: 'HORMONES',
          price: 20000,
          turnaroundTime: '2 hours',
          sampleType: 'Serum',
          containerType: 'Plain Tube',
          storageRequirements: 'Store at 2-8°C if not tested immediately',
          isActive: true,
        },
      ];

      for (const test of tests) {
        await firestoreService.create<Test>(COLLECTIONS.TESTS, test);
      }

      console.log('Common tests seeded successfully');
    } catch (error) {
      console.error('Error seeding tests:', error);
    }
  },

  async seedDefaultUsers(): Promise<void> {
    try {
      // Get facilities first
      const facilities = await firestoreService.getAll<Facility>(COLLECTIONS.FACILITIES);
      
      if (facilities.length === 0) {
        console.log('No facilities found. Please seed facilities first.');
        return;
      }

      const defaultUsers = [
        {
          firstName: 'Admin',
          lastName: 'Owner',
          email: 'admin@firstlinelab.ug',
          phone: '+256 700 000 100',
          role: 'owner' as const,
          facilityId: facilities[0].id,
          password: 'Admin123!',
        },
        {
          firstName: 'John',
          lastName: 'Receptionist',
          email: 'reception@firstlinelab.ug',
          phone: '+256 700 000 101',
          role: 'receptionist' as const,
          facilityId: facilities[0].id,
          password: 'Reception123!',
        },
        {
          firstName: 'Mary',
          lastName: 'Clerk',
          email: 'clerk@firstlinelab.ug',
          phone: '+256 700 000 102',
          role: 'clerk' as const,
          facilityId: facilities[0].id,
          password: 'Clerk123!',
        },
        {
          firstName: 'David',
          lastName: 'LabTech',
          email: 'labtech@firstlinelab.ug',
          phone: '+256 700 000 103',
          role: 'lab_tech' as const,
          facilityId: facilities[0].id,
          password: 'LabTech123!',
        },
      ];

      for (const user of defaultUsers) {
        try {
          await userService.createUser(user);
          console.log(`Created user: ${user.email}`);
        } catch (error: any) {
          if (error.message.includes('email-already-in-use')) {
            console.log(`User ${user.email} already exists, skipping...`);
          } else {
            console.error(`Error creating user ${user.email}:`, error);
          }
        }
      }

      console.log('Default users seeded successfully');
    } catch (error) {
      console.error('Error seeding default users:', error);
    }
  },

  async seedAll(): Promise<void> {
    console.log('Starting database seeding...');
    
    await this.seedFacilities();
    await this.seedTestCategories();
    await this.seedCommonTests();
    await this.seedDefaultUsers();
    
    console.log('Database seeding completed!');
  },
};