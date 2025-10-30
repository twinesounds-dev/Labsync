import { Test, SampleType, ContainerType } from '@/types';

/**
 * Sample Mapping Utility
 * Maps test codes to required sample types and containers
 * Based on Uganda lab standards and common practice
 */

export interface SampleRequirement {
  sampleType: SampleType;
  containerType: ContainerType;
  volumeRequired: string;
  collectionInstructions?: string;
  storageRequirements?: string;
}

// Test code to sample mapping
export const TEST_SAMPLE_MAPPING: Record<string, SampleRequirement> = {
  // HEMATOLOGY
  'FBC': {
    sampleType: 'BLOOD_EDTA',
    containerType: 'EDTA_TUBE',
    volumeRequired: '3-5ml',
    collectionInstructions: 'Mix tube gently after collection to prevent clotting',
    storageRequirements: 'Room temperature, test within 4 hours',
  },
  'MP': {
    sampleType: 'BLOOD_EDTA',
    containerType: 'EDTA_TUBE',
    volumeRequired: '2-3ml',
    collectionInstructions: 'Collect during fever spike if possible',
  },
  'BGRH': {
    sampleType: 'BLOOD_EDTA',
    containerType: 'EDTA_TUBE',
    volumeRequired: '2-3ml',
  },
  'ESR': {
    sampleType: 'BLOOD_EDTA',
    containerType: 'EDTA_TUBE',
    volumeRequired: '3-5ml',
    collectionInstructions: 'Test within 2 hours of collection',
  },
  'RETIC': {
    sampleType: 'BLOOD_EDTA',
    containerType: 'EDTA_TUBE',
    volumeRequired: '3-5ml',
  },
  'HBA1C': {
    sampleType: 'BLOOD_EDTA',
    containerType: 'EDTA_TUBE',
    volumeRequired: '3-5ml',
    collectionInstructions: 'No fasting required',
  },

  // BIOCHEMISTRY - SERUM
  'LFT': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '5-7ml',
    collectionInstructions: 'Allow blood to clot for 30 minutes before centrifuging',
    storageRequirements: 'Separate serum, refrigerate if not tested immediately',
  },
  'RFT': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '5-7ml',
    collectionInstructions: 'Patient should be well hydrated',
  },
  'LIPID': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '5-7ml',
    collectionInstructions: 'Patient must fast for 12-14 hours',
  },
  'HBSAG': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '3-5ml',
  },
  'HCV': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '3-5ml',
  },
  'RPR': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '3-5ml',
  },
  'TFT': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '5-7ml',
  },
  'PSA': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '3-5ml',
    collectionInstructions: 'Avoid vigorous exercise 48 hours before test',
  },
  'BHCG': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '3-5ml',
  },
  'PROG': {
    sampleType: 'BLOOD_SERUM',
    containerType: 'PLAIN_TUBE',
    volumeRequired: '3-5ml',
    collectionInstructions: 'Note day of menstrual cycle',
  },

  // BIOCHEMISTRY - FLUORIDE (GLUCOSE)
  'GLUC': {
    sampleType: 'BLOOD_FLUORIDE',
    containerType: 'FLUORIDE_TUBE',
    volumeRequired: '3-5ml',
    collectionInstructions: 'For fasting glucose: patient must fast 8-12 hours',
    storageRequirements: 'Fluoride prevents glycolysis, stable for 24 hours',
  },

  // SEROLOGY
  'HIV': {
    sampleType: 'BLOOD_EDTA',
    containerType: 'EDTA_TUBE',
    volumeRequired: '3-5ml',
    collectionInstructions: 'Ensure proper counseling before and after test',
  },
  'COVID': {
    sampleType: 'SWAB',
    containerType: 'SWAB_KIT',
    volumeRequired: 'Nasopharyngeal swab',
    collectionInstructions: 'Insert swab 5-7cm into nostril, rotate gently',
    storageRequirements: 'Keep in viral transport medium',
  },

  // MICROBIOLOGY
  'C&S': {
    sampleType: 'OTHER',
    containerType: 'STERILE_CONTAINER',
    volumeRequired: 'Varies by specimen type',
    collectionInstructions: 'Use sterile technique, collect before antibiotics if possible',
  },
  'GXP': {
    sampleType: 'SPUTUM',
    containerType: 'SPUTUM_CONTAINER',
    volumeRequired: '2-5ml',
    collectionInstructions: 'Early morning specimen preferred, deep cough required',
    storageRequirements: 'Room temperature, test within 2 hours',
  },
  'STOOL': {
    sampleType: 'STOOL',
    containerType: 'STOOL_CONTAINER',
    volumeRequired: 'Walnut-sized sample',
    collectionInstructions: 'Avoid contamination with urine or water',
    storageRequirements: 'Test within 2 hours for best results',
  },
  'URINE': {
    sampleType: 'URINE',
    containerType: 'URINE_CONTAINER',
    volumeRequired: '20-30ml',
    collectionInstructions: 'Mid-stream clean catch specimen',
    storageRequirements: 'Refrigerate if not tested within 2 hours',
  },
  'GRAM': {
    sampleType: 'OTHER',
    containerType: 'STERILE_CONTAINER',
    volumeRequired: 'Varies',
    collectionInstructions: 'Use sterile technique',
  },
};

/**
 * Get sample requirements for a test
 */
export function getSampleRequirementsForTest(testCode: string): SampleRequirement | null {
  return TEST_SAMPLE_MAPPING[testCode] || null;
}

/**
 * Get sample requirements for multiple tests
 * Groups tests by sample type to optimize collection
 */
export function getSampleRequirementsForTests(testCodes: string[]): {
  sampleGroups: Map<SampleType, {
    tests: string[];
    containerType: ContainerType;
    volumeRequired: string;
    collectionInstructions: string[];
  }>;
  unmappedTests: string[];
} {
  const sampleGroups = new Map<SampleType, {
    tests: string[];
    containerType: ContainerType;
    volumeRequired: string;
    collectionInstructions: string[];
  }>();
  const unmappedTests: string[] = [];

  testCodes.forEach(testCode => {
    const requirement = getSampleRequirementsForTest(testCode);
    
    if (!requirement) {
      unmappedTests.push(testCode);
      return;
    }

    const existing = sampleGroups.get(requirement.sampleType);
    
    if (existing) {
      existing.tests.push(testCode);
      if (requirement.collectionInstructions && !existing.collectionInstructions.includes(requirement.collectionInstructions)) {
        existing.collectionInstructions.push(requirement.collectionInstructions);
      }
    } else {
      sampleGroups.set(requirement.sampleType, {
        tests: [testCode],
        containerType: requirement.containerType,
        volumeRequired: requirement.volumeRequired,
        collectionInstructions: requirement.collectionInstructions ? [requirement.collectionInstructions] : [],
      });
    }
  });

  return { sampleGroups, unmappedTests };
}

/**
 * Get human-readable sample type name
 */
export function getSampleTypeName(sampleType: SampleType): string {
  const names: Record<SampleType, string> = {
    'BLOOD_EDTA': 'Blood (EDTA - Purple Top)',
    'BLOOD_SERUM': 'Blood (Serum - Red/Gold Top)',
    'BLOOD_PLASMA': 'Blood (Plasma - Green Top)',
    'BLOOD_FLUORIDE': 'Blood (Fluoride - Grey Top)',
    'URINE': 'Urine',
    'STOOL': 'Stool',
    'SPUTUM': 'Sputum',
    'SWAB': 'Swab',
    'CSF': 'Cerebrospinal Fluid (CSF)',
    'OTHER': 'Other',
  };
  return names[sampleType] || sampleType;
}

/**
 * Get human-readable container type name
 */
export function getContainerTypeName(containerType: ContainerType): string {
  const names: Record<ContainerType, string> = {
    'EDTA_TUBE': 'EDTA Tube (Purple Top)',
    'PLAIN_TUBE': 'Plain Tube (Red/Gold Top)',
    'FLUORIDE_TUBE': 'Fluoride Tube (Grey Top)',
    'HEPARIN_TUBE': 'Heparin Tube (Green Top)',
    'URINE_CONTAINER': 'Sterile Urine Container',
    'STOOL_CONTAINER': 'Stool Container',
    'SPUTUM_CONTAINER': 'Sputum Container',
    'SWAB_KIT': 'Swab Collection Kit',
    'STERILE_CONTAINER': 'Sterile Container',
    'OTHER': 'Other Container',
  };
  return names[containerType] || containerType;
}

/**
 * Validate sample quality based on test requirements
 */
export function validateSampleQuality(
  testCode: string,
  sampleStatus: string,
  volumeCollected?: string
): {
  isValid: boolean;
  issues: string[];
} {
  const requirement = getSampleRequirementsForTest(testCode);
  const issues: string[] = [];

  if (!requirement) {
    issues.push('Unknown test code - cannot validate sample');
    return { isValid: false, issues };
  }

  // Check sample status
  if (sampleStatus === 'REJECTED' || sampleStatus === 'CONTAMINATED') {
    issues.push('Sample has been rejected or contaminated');
  }

  if (sampleStatus === 'INSUFFICIENT') {
    issues.push(`Insufficient volume - requires ${requirement.volumeRequired}`);
  }

  if (sampleStatus === 'HEMOLYZED') {
    issues.push('Sample is hemolyzed - may affect test results');
  }

  if (sampleStatus === 'CLOTTED' && requirement.sampleType.includes('EDTA')) {
    issues.push('Blood sample clotted - EDTA tube should prevent clotting');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
