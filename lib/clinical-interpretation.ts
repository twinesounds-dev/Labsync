/**
 * CLINICAL INTERPRETATION ENGINE
 * Automatically generates clinical interpretations based on test results
 * with Uganda-specific disease patterns and medical guidelines
 */

import { TestResult, Patient, ClinicalInterpretationTemplate } from '@/types';
import { getNormalRangeForParameter } from './clinical-ranges';

/**
 * CLINICAL INTERPRETATION TEMPLATES
 * Pre-configured interpretations for common conditions
 */

export const CLINICAL_INTERPRETATION_TEMPLATES: Record<string, ClinicalInterpretationTemplate[]> = {
  // MALARIA
  MP: [
    {
      id: 'malaria-positive',
      testId: 'MP',
      triggerType: 'single_parameter',
      triggerParameters: ['Malaria Parasite'],
      triggerConditions: [
        { parameter: 'Malaria Parasite', condition: 'positive' },
      ],
      title: 'Malaria Infection Detected',
      interpretation:
        'Malaria parasites are PRESENT in the blood film, confirming active malaria infection. This is a common finding in Uganda and requires prompt antimalarial treatment.',
      clinicalSignificance:
        'Active malaria infection can cause fever, chills, headache, and body aches. If untreated, it may progress to severe malaria with complications including cerebral malaria, severe anemia, and organ failure.',
      recommendations: [
        'Initiate appropriate antimalarial therapy (Artemether-Lumefantrine or Quinine based on severity)',
        'Monitor for signs of severe malaria (altered consciousness, severe anemia, respiratory distress)',
        'Advise on mosquito bite prevention measures (insecticide-treated bed nets, repellents)',
        'Follow-up in 3 days to confirm parasite clearance',
        'Ensure adequate hydration and fever management',
      ],
      urgencyLevel: 'attention_required',
      requiresNotification: true,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
  ],

  // HIV
  HIV: [
    {
      id: 'hiv-reactive',
      testId: 'HIV',
      triggerType: 'single_parameter',
      triggerParameters: ['HIV Test'],
      triggerConditions: [{ parameter: 'HIV Test', condition: 'positive' }],
      title: 'HIV Screening Test - Reactive',
      interpretation:
        'HIV screening test is REACTIVE. This preliminary result suggests possible HIV infection and requires confirmatory testing as per Uganda national HIV testing algorithm.',
      clinicalSignificance:
        'A reactive HIV screening test indicates the presence of HIV antibodies. However, confirmation with additional tests is essential before diagnosis. Early detection and treatment significantly improve outcomes and prevent transmission.',
      recommendations: [
        'URGENT: Perform confirmatory HIV testing using national algorithm (tie-breaker test)',
        'Refer to HIV clinic/ART center for comprehensive evaluation',
        'Pre-ART counseling and psychosocial support',
        'Partner notification and testing',
        'Baseline CD4 count and viral load if confirmed positive',
        'Immediate ART initiation if confirmed (Test and Treat strategy)',
        'Screen for tuberculosis and other opportunistic infections',
      ],
      urgencyLevel: 'urgent',
      requiresNotification: true,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
  ],

  // LIVER FUNCTION ABNORMALITIES
  LFT: [
    {
      id: 'elevated-liver-enzymes',
      testId: 'LFT',
      triggerType: 'multiple_parameters',
      triggerParameters: ['AST (SGOT)', 'ALT (SGPT)'],
      triggerConditions: [
        { parameter: 'AST (SGOT)', condition: 'high' },
        { parameter: 'ALT (SGPT)', condition: 'high' },
      ],
      title: 'Elevated Liver Enzymes',
      interpretation:
        'Liver transaminases (AST and ALT) are elevated above normal limits, indicating hepatocellular injury or inflammation. This pattern suggests possible liver disease or hepatotoxicity.',
      clinicalSignificance:
        'Elevated liver enzymes indicate liver cell damage. Common causes in Uganda include viral hepatitis (B and C), alcohol-related liver disease, drug-induced hepatotoxicity (including herbal medicines), fatty liver disease, and malaria.',
      recommendations: [
        'Perform hepatitis B and C serology testing',
        'Review medication history including herbal preparations',
        'Assess alcohol consumption history',
        'Consider liver ultrasound if persistent elevation',
        'Avoid hepatotoxic medications and alcohol',
        'Repeat liver function tests in 2-4 weeks',
        'Hepatology referral if severe or progressive elevation',
      ],
      urgencyLevel: 'attention_required',
      requiresNotification: false,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'elevated-bilirubin',
      testId: 'LFT',
      triggerType: 'single_parameter',
      triggerParameters: ['Total Bilirubin'],
      triggerConditions: [{ parameter: 'Total Bilirubin', condition: 'high' }],
      title: 'Elevated Bilirubin (Jaundice)',
      interpretation:
        'Total bilirubin is elevated, indicating hyperbilirubinemia which may manifest as jaundice (yellowing of skin and eyes). This requires evaluation to determine if it is prehepatic, hepatic, or posthepatic in origin.',
      clinicalSignificance:
        'Elevated bilirubin can result from increased breakdown of red blood cells (hemolysis), liver dysfunction, or bile duct obstruction. In Uganda, consider malaria-related hemolysis, viral hepatitis, and sickle cell disease.',
      recommendations: [
        'Assess direct vs indirect bilirubin fraction to determine cause',
        'Screen for hemolysis: reticulocyte count, LDH, haptoglobin',
        'Malaria parasite test if not done recently',
        'Hepatitis serology and liver ultrasound',
        'Monitor for signs of liver failure',
        'Avoid medications metabolized by the liver',
      ],
      urgencyLevel: 'attention_required',
      requiresNotification: false,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
  ],

  // RENAL FUNCTION ABNORMALITIES
  RFT: [
    {
      id: 'renal-impairment',
      testId: 'RFT',
      triggerType: 'multiple_parameters',
      triggerParameters: ['Creatinine', 'Urea'],
      triggerConditions: [
        { parameter: 'Creatinine', condition: 'high' },
        { parameter: 'Urea', condition: 'high' },
      ],
      title: 'Renal Impairment Detected',
      interpretation:
        'Elevated creatinine and urea levels indicate impaired kidney function. This suggests acute or chronic kidney injury requiring further evaluation and management.',
      clinicalSignificance:
        'Renal impairment can result from various causes including hypertension, diabetes, glomerulonephritis, HIV-associated nephropathy, and nephrotoxic drugs. Early detection is crucial to prevent progression to end-stage renal disease.',
      recommendations: [
        'Calculate eGFR to stage kidney disease',
        'Assess for reversible causes (dehydration, nephrotoxic drugs, obstruction)',
        'Check electrolytes, especially potassium',
        'Urinalysis to assess proteinuria and hematuria',
        'Blood pressure monitoring and control',
        'Adjust medication doses for renal function',
        'Nephrology referral if eGFR <30 or rapid decline',
        'Consider renal ultrasound',
        'Screen for diabetes and HIV if not already done',
      ],
      urgencyLevel: 'attention_required',
      requiresNotification: true,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'hyperkalemia',
      testId: 'RFT',
      triggerType: 'single_parameter',
      triggerParameters: ['Potassium'],
      triggerConditions: [{ parameter: 'Potassium', condition: 'critical_high' }],
      title: 'CRITICAL: Severe Hyperkalemia',
      interpretation:
        'CRITICAL ALERT: Potassium level is critically elevated (>6.5 mmol/L). This is a life-threatening electrolyte abnormality that can cause fatal cardiac arrhythmias.',
      clinicalSignificance:
        'Severe hyperkalemia is a medical emergency that can lead to sudden cardiac arrest. Immediate treatment is required to prevent life-threatening arrhythmias.',
      recommendations: [
        'IMMEDIATE: ECG to assess for cardiac toxicity (peaked T waves, widened QRS)',
        'IMMEDIATE: Cardiology/Emergency consultation',
        'Consider emergency treatment: IV calcium gluconate for cardiac protection',
        'Insulin-glucose infusion to shift potassium intracellularly',
        'Consider salbutamol nebulization',
        'Dialysis may be required if severe or refractory',
        'Discontinue potassium-sparing medications',
        'Continuous cardiac monitoring',
      ],
      urgencyLevel: 'critical',
      requiresNotification: true,
      notificationRecipients: ['owner', 'referring_physician'],
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
  ],

  // ANEMIA
  FBC: [
    {
      id: 'severe-anemia',
      testId: 'FBC',
      triggerType: 'single_parameter',
      triggerParameters: ['Hemoglobin'],
      triggerConditions: [{ parameter: 'Hemoglobin', condition: 'critical_low' }],
      title: 'CRITICAL: Severe Anemia',
      interpretation:
        'CRITICAL ALERT: Hemoglobin level is critically low (<7.0 g/dL), indicating severe anemia. This requires urgent medical attention and possible blood transfusion.',
      clinicalSignificance:
        'Severe anemia can lead to heart failure, organ hypoxia, and death if untreated. Common causes in Uganda include malaria, hookworm infection, nutritional deficiencies (iron, folate, B12), HIV, and chronic diseases.',
      recommendations: [
        'URGENT: Clinical assessment for hemodynamic stability',
        'Consider urgent blood transfusion if symptomatic or Hb <5 g/dL',
        'Malaria parasite test if not done (treat empirically if high suspicion)',
        'Blood film for red cell morphology',
        'Reticulocyte count to assess bone marrow response',
        'Iron studies, B12, and folate levels',
        'Stool for ova and parasites (hookworm)',
        'HIV testing if status unknown',
        'Identify and treat underlying cause',
      ],
      urgencyLevel: 'critical',
      requiresNotification: true,
      notificationRecipients: ['owner', 'referring_physician'],
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'leukocytosis',
      testId: 'FBC',
      triggerType: 'single_parameter',
      triggerParameters: ['WBC Count'],
      triggerConditions: [{ parameter: 'WBC Count', condition: 'high' }],
      title: 'Elevated White Blood Cell Count',
      interpretation:
        'White blood cell count is elevated above normal limits, indicating leukocytosis. This typically suggests infection, inflammation, or stress response.',
      clinicalSignificance:
        'Leukocytosis is commonly seen with bacterial infections, but can also occur with viral infections, inflammation, stress, or hematologic disorders. Clinical correlation is essential.',
      recommendations: [
        'Clinical assessment for signs of infection (fever, localized symptoms)',
        'Consider differential white cell count to identify predominant cell type',
        'Blood culture if bacterial infection suspected',
        'Chest X-ray if respiratory symptoms',
        'Urinalysis and culture if urinary symptoms',
        'Monitor response to treatment',
        'If persistently elevated without infection, consider hematology referral',
      ],
      urgencyLevel: 'attention_required',
      requiresNotification: false,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'thrombocytopenia',
      testId: 'FBC',
      triggerType: 'single_parameter',
      triggerParameters: ['Platelet Count'],
      triggerConditions: [{ parameter: 'Platelet Count', condition: 'low' }],
      title: 'Low Platelet Count (Thrombocytopenia)',
      interpretation:
        'Platelet count is below normal limits, indicating thrombocytopenia. This increases the risk of bleeding and requires investigation of the underlying cause.',
      clinicalSignificance:
        'Thrombocytopenia can result from decreased production (bone marrow disorders), increased destruction (immune-mediated, infections), or sequestration (splenomegaly). In Uganda, consider malaria, HIV, and dengue fever.',
      recommendations: [
        'Assess for bleeding symptoms (petechiae, bruising, mucosal bleeding)',
        'Malaria parasite test if febrile',
        'HIV test if status unknown',
        'Blood film review for platelet clumping (pseudothrombocytopenia)',
        'Avoid aspirin and NSAIDs',
        'Avoid IM injections if platelet count <50,000',
        'Urgent hematology referral if <20,000 or bleeding',
        'Consider bone marrow examination if cause unclear',
      ],
      urgencyLevel: 'attention_required',
      requiresNotification: true,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
  ],

  // DIABETES
  GLUC: [
    {
      id: 'hyperglycemia',
      testId: 'GLUC',
      triggerType: 'single_parameter',
      triggerParameters: ['Glucose (Fasting)', 'Glucose (Random)'],
      triggerConditions: [
        { parameter: 'Glucose (Fasting)', condition: 'high' },
      ],
      title: 'Elevated Blood Glucose (Hyperglycemia)',
      interpretation:
        'Blood glucose level is elevated above normal limits, suggesting impaired glucose metabolism or diabetes mellitus.',
      clinicalSignificance:
        'Elevated fasting glucose (>100 mg/dL) may indicate prediabetes or diabetes. Diabetes is a growing health concern in Uganda, associated with cardiovascular disease, kidney disease, and other complications.',
      recommendations: [
        'Confirm diagnosis with repeat fasting glucose or HbA1c',
        'Screen for diabetes complications: renal function, lipid profile, urinalysis',
        'Fundoscopy for diabetic retinopathy',
        'Cardiovascular risk assessment',
        'Lifestyle modification counseling (diet, exercise, weight loss)',
        'Consider antidiabetic medication if diabetes confirmed',
        'Regular monitoring of blood glucose',
        'Diabetes education and self-management training',
      ],
      urgencyLevel: 'attention_required',
      requiresNotification: false,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'hypoglycemia',
      testId: 'GLUC',
      triggerType: 'single_parameter',
      triggerParameters: ['Glucose (Fasting)', 'Glucose (Random)'],
      triggerConditions: [
        { parameter: 'Glucose (Fasting)', condition: 'critical_low' },
      ],
      title: 'CRITICAL: Severe Hypoglycemia',
      interpretation:
        'CRITICAL ALERT: Blood glucose level is critically low (<40 mg/dL). This is a medical emergency that can cause seizures, loss of consciousness, and brain damage.',
      clinicalSignificance:
        'Severe hypoglycemia requires immediate treatment. Common causes include excessive diabetes medication, inadequate food intake, alcohol consumption, or insulin-secreting tumors.',
      recommendations: [
        'IMMEDIATE: Assess consciousness level',
        'IMMEDIATE: Administer glucose (oral if conscious, IV dextrose if unconscious)',
        'Monitor glucose levels every 15-30 minutes until stable',
        'Review diabetes medications and adjust if needed',
        'Educate on hypoglycemia recognition and management',
        'Consider glucagon prescription for home use',
        'Investigate cause if recurrent or unexplained',
      ],
      urgencyLevel: 'critical',
      requiresNotification: true,
      notificationRecipients: ['owner', 'referring_physician'],
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
  ],

  // HEPATITIS
  HBSAG: [
    {
      id: 'hbsag-positive',
      testId: 'HBSAG',
      triggerType: 'single_parameter',
      triggerParameters: ['HBsAg'],
      triggerConditions: [{ parameter: 'HBsAg', condition: 'positive' }],
      title: 'Hepatitis B Surface Antigen Positive',
      interpretation:
        'Hepatitis B surface antigen (HBsAg) is POSITIVE, indicating active Hepatitis B virus infection. This requires further evaluation to determine if infection is acute or chronic.',
      clinicalSignificance:
        'Hepatitis B is endemic in Uganda with significant implications for liver health and transmission risk. Chronic infection can lead to cirrhosis and hepatocellular carcinoma.',
      recommendations: [
        'Perform liver function tests if not already done',
        'Hepatitis B e-antigen (HBeAg) and antibody testing',
        'Hepatitis B viral load quantification',
        'Screen household contacts and sexual partners',
        'Vaccination of susceptible contacts',
        'Counsel on transmission prevention (safe sex, avoid sharing sharps)',
        'Assess for antiviral therapy eligibility',
        'Hepatology referral for management',
        'Screen for hepatocellular carcinoma (AFP, liver ultrasound) if chronic',
        'Avoid alcohol and hepatotoxic medications',
      ],
      urgencyLevel: 'attention_required',
      requiresNotification: true,
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
  ],

  // TUBERCULOSIS
  GXP: [
    {
      id: 'tb-detected',
      testId: 'GXP',
      triggerType: 'single_parameter',
      triggerParameters: ['MTB Detection'],
      triggerConditions: [{ parameter: 'MTB Detection', condition: 'positive' }],
      title: 'Tuberculosis Detected',
      interpretation:
        'GeneXpert has detected Mycobacterium tuberculosis DNA, confirming active tuberculosis infection. Rifampicin resistance status is indicated separately.',
      clinicalSignificance:
        'Tuberculosis is a major public health concern in Uganda, especially among HIV-positive individuals. Early detection and treatment are crucial to prevent transmission and complications.',
      recommendations: [
        'URGENT: Initiate anti-tuberculosis treatment as per Uganda national TB guidelines',
        'Notify TB program and register patient',
        'HIV testing if status unknown (TB-HIV co-infection common)',
        'Screen household contacts',
        'Isolation and infection control measures',
        'Directly Observed Therapy (DOT) arrangement',
        'Baseline investigations: chest X-ray, liver function, renal function',
        'If rifampicin resistance detected: referral for MDR-TB management',
        'Monitor for drug side effects and treatment response',
        'Nutritional support and psychosocial counseling',
      ],
      urgencyLevel: 'urgent',
      requiresNotification: true,
      notificationRecipients: ['owner', 'referring_physician', 'tb_program'],
      isSystemGenerated: true,
      isEditable: true,
      isActive: true,
      createdAt: new Date(),
    },
  ],
};

/**
 * RESULT FLAGGING ENGINE
 * Automatically flags test results based on normal ranges
 */

export interface FlagResult {
  flag: 'Normal' | 'Low' | 'High' | 'Critical Low' | 'Critical High' | 'Critical' | 'N/A';
  interpretation: string;
  requiresAttention: boolean;
  isCritical: boolean;
}

/**
 * Determine the flag for a result value based on normal ranges
 */
export function flagResultValue(
  testCode: string,
  parameter: string,
  value: string | number,
  gender: 'Male' | 'Female'
): FlagResult {
  const normalRange = getNormalRangeForParameter(testCode, parameter);

  if (!normalRange) {
    return {
      flag: 'N/A',
      interpretation: 'No reference range available',
      requiresAttention: false,
      isCritical: false,
    };
  }

  // Handle numeric ranges
  if (normalRange.rangeType === 'numeric' && typeof value === 'number') {
    // Determine which range to use based on gender
    let normalMin: number | undefined;
    let normalMax: number | undefined;
    let criticalLow: number | undefined;
    let criticalHigh: number | undefined;

    if (gender === 'Male' && normalRange.normalMinMale !== undefined) {
      normalMin = normalRange.normalMinMale;
      normalMax = normalRange.normalMaxMale;
      criticalLow = normalRange.criticalLowMale;
      criticalHigh = normalRange.criticalHighMale;
    } else if (gender === 'Female' && normalRange.normalMinFemale !== undefined) {
      normalMin = normalRange.normalMinFemale;
      normalMax = normalRange.normalMaxFemale;
      criticalLow = normalRange.criticalLowFemale;
      criticalHigh = normalRange.criticalHighFemale;
    } else {
      normalMin = normalRange.normalMinGeneral;
      normalMax = normalRange.normalMaxGeneral;
      criticalLow = normalRange.criticalLowGeneral;
      criticalHigh = normalRange.criticalHighGeneral;
    }

    // Check critical thresholds first
    if (criticalLow !== undefined && value < criticalLow) {
      return {
        flag: 'Critical Low',
        interpretation: `Critically low value requiring immediate attention`,
        requiresAttention: true,
        isCritical: true,
      };
    }

    if (criticalHigh !== undefined && value > criticalHigh) {
      return {
        flag: 'Critical High',
        interpretation: `Critically high value requiring immediate attention`,
        requiresAttention: true,
        isCritical: true,
      };
    }

    // Check normal ranges
    if (normalMin !== undefined && value < normalMin) {
      return {
        flag: 'Low',
        interpretation: `Below normal range`,
        requiresAttention: true,
        isCritical: false,
      };
    }

    if (normalMax !== undefined && value > normalMax) {
      return {
        flag: 'High',
        interpretation: `Above normal range`,
        requiresAttention: true,
        isCritical: false,
      };
    }

    return {
      flag: 'Normal',
      interpretation: 'Within normal limits',
      requiresAttention: false,
      isCritical: false,
    };
  }

  // Handle qualitative tests
  if (normalRange.rangeType === 'qualitative') {
    const valueStr = String(value).trim();
    const normalValue = normalRange.normalValue?.trim().toLowerCase();
    const abnormalValues = normalRange.abnormalValues?.map((v) => v.toLowerCase()) || [];

    if (normalValue && valueStr.toLowerCase() === normalValue) {
      return {
        flag: 'Normal',
        interpretation: 'Normal result',
        requiresAttention: false,
        isCritical: false,
      };
    }

    if (abnormalValues.some((av) => valueStr.toLowerCase() === av || valueStr.toLowerCase().includes(av))) {
      return {
        flag: 'High',
        interpretation: 'Abnormal result detected',
        requiresAttention: true,
        isCritical: false,
      };
    }

    return {
      flag: 'N/A',
      interpretation: 'Result documented',
      requiresAttention: false,
      isCritical: false,
    };
  }

  // Category types (Blood Group, etc.)
  return {
    flag: 'N/A',
    interpretation: 'Categorical result',
    requiresAttention: false,
    isCritical: false,
  };
}

/**
 * Generate clinical interpretation for a test result
 */
export function generateClinicalInterpretation(
  testResult: TestResult
): {
  autoInterpretation: string;
  abnormalFindings: string[];
  criticalAlerts: string[];
  recommendations: string[];
  urgencyLevel: 'routine' | 'attention_required' | 'urgent' | 'critical';
} {
  const test = testResult.test;
  if (!test) {
    return {
      autoInterpretation: 'Test information not available for interpretation.',
      abnormalFindings: [],
      criticalAlerts: [],
      recommendations: [],
      urgencyLevel: 'routine',
    };
  }

  const abnormalFindings: string[] = [];
  const criticalAlerts: string[] = [];
  const allRecommendations: string[] = [];
  let maxUrgency: 'routine' | 'attention_required' | 'urgent' | 'critical' = 'routine';

  // Analyze each result value
  for (const resultValue of testResult.resultValues) {
    if (resultValue.flag === 'Critical' || resultValue.flag === 'Critical High' || resultValue.flag === 'Critical Low') {
      criticalAlerts.push(
        `${resultValue.parameter}: ${resultValue.value} ${resultValue.unit} (Critical - ${resultValue.normalRange})`
      );
      maxUrgency = 'critical';
    } else if (resultValue.flag === 'High' || resultValue.flag === 'Low') {
      abnormalFindings.push(
        `${resultValue.parameter}: ${resultValue.value} ${resultValue.unit} (${resultValue.flag} - Normal: ${resultValue.normalRange})`
      );
      if (maxUrgency === 'routine') {
        maxUrgency = 'attention_required';
      }
    }
  }

  // Get applicable interpretation templates
  const templates = CLINICAL_INTERPRETATION_TEMPLATES[test.code] || [];
  const matchedTemplates: ClinicalInterpretationTemplate[] = [];

  for (const template of templates) {
    if (!template.isActive) continue;

    let matches = false;

    if (template.triggerType === 'single_parameter' && template.triggerConditions) {
      for (const condition of template.triggerConditions) {
        const resultValue = testResult.resultValues.find((rv) => rv.parameter === condition.parameter);
        if (resultValue) {
          const conditionMet =
            (condition.condition === 'high' && (resultValue.flag === 'High' || resultValue.flag === 'Critical High')) ||
            (condition.condition === 'low' && (resultValue.flag === 'Low' || resultValue.flag === 'Critical Low')) ||
            (condition.condition === 'critical_high' && resultValue.flag === 'Critical High') ||
            (condition.condition === 'critical_low' && resultValue.flag === 'Critical Low') ||
            (condition.condition === 'positive' &&
              (String(resultValue.value).toLowerCase().includes('positive') ||
                String(resultValue.value).toLowerCase().includes('reactive') ||
                String(resultValue.value).toLowerCase().includes('detected') ||
                String(resultValue.value) === '+')) ||
            (condition.condition === 'negative' &&
              (String(resultValue.value).toLowerCase().includes('negative') ||
                String(resultValue.value).toLowerCase().includes('non-reactive') ||
                String(resultValue.value).toLowerCase().includes('not detected')));

          if (conditionMet) {
            matches = true;
            break;
          }
        }
      }
    } else if (template.triggerType === 'multiple_parameters' && template.triggerConditions) {
      let allConditionsMet = true;
      for (const condition of template.triggerConditions) {
        const resultValue = testResult.resultValues.find((rv) => rv.parameter === condition.parameter);
        if (!resultValue) {
          allConditionsMet = false;
          break;
        }

        const conditionMet =
          (condition.condition === 'high' && (resultValue.flag === 'High' || resultValue.flag === 'Critical High')) ||
          (condition.condition === 'low' && (resultValue.flag === 'Low' || resultValue.flag === 'Critical Low'));

        if (!conditionMet) {
          allConditionsMet = false;
          break;
        }
      }
      matches = allConditionsMet;
    }

    if (matches) {
      matchedTemplates.push(template);
      allRecommendations.push(...(template.recommendations || []));

      if (template.urgencyLevel === 'critical') {
        maxUrgency = 'critical';
      } else if (template.urgencyLevel === 'urgent' && maxUrgency !== 'critical') {
        maxUrgency = 'urgent';
      } else if (template.urgencyLevel === 'attention_required' && maxUrgency === 'routine') {
        maxUrgency = 'attention_required';
      }
    }
  }

  // Generate interpretation text
  let autoInterpretation = '';

  if (matchedTemplates.length > 0) {
    autoInterpretation = matchedTemplates
      .map((t) => {
        let text = `**${t.title}**\n\n`;
        text += `${t.interpretation}\n\n`;
        if (t.clinicalSignificance) {
          text += `**Clinical Significance:** ${t.clinicalSignificance}\n\n`;
        }
        return text;
      })
      .join('\n---\n\n');
  } else if (abnormalFindings.length === 0 && criticalAlerts.length === 0) {
    autoInterpretation = `All test parameters are within normal reference ranges. Results are consistent with normal ${test.name.toLowerCase()}.`;
  } else {
    autoInterpretation = `The following abnormalities were detected in ${test.name}:\n\n${abnormalFindings.join('\n')}\n\n${
      criticalAlerts.length > 0 ? `**Critical Values:**\n${criticalAlerts.join('\n')}\n\n` : ''
    }Clinical correlation is recommended. Please review findings in the context of patient's clinical presentation and history.`;
  }

  // Remove duplicate recommendations
  const uniqueRecommendations = Array.from(new Set(allRecommendations));

  return {
    autoInterpretation,
    abnormalFindings,
    criticalAlerts,
    recommendations: uniqueRecommendations,
    urgencyLevel: maxUrgency,
  };
}

/**
 * Get a summary interpretation badge/label
 */
export function getInterpretationSummary(testResult: TestResult): {
  label: string;
  color: string;
  icon: string;
} {
  if (testResult.hasCriticalValues) {
    return {
      label: 'CRITICAL FINDINGS',
      color: 'red',
      icon: '⚠️',
    };
  }

  if (testResult.hasAbnormalValues) {
    return {
      label: 'ABNORMAL FINDINGS',
      color: 'orange',
      icon: '⚡',
    };
  }

  return {
    label: 'NORMAL RESULTS',
    color: 'green',
    icon: '✓',
  };
}
