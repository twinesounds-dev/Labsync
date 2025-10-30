# 🏥 LabSync Patient Workflow Diagrams

## Visual Reference for All Staff

---

## 📊 OVERVIEW: THREE PATIENT PATHWAYS

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT ARRIVES                           │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼─────┐        ┌──────▼──────┐
    │ Has Form? │        │ From our    │
    │ From Dr?  │        │ facility?   │
    └─────┬─────┘        └──────┬──────┘
          │                     │
    ┌─────┴─────┐              │
    │           │              │
   YES         NO              YES
    │           │              │
    ▼           ▼              ▼
┌────────┐  ┌────────┐   ┌───────────┐
│REFERRAL│  │WALK-IN │   │ INPATIENT │
│  PATH  │  │  PATH  │   │   PATH    │
└────────┘  └────────┘   └───────────┘
```

---

## 🚶 WALK-IN PATIENT DETAILED FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: RECEPTION - REGISTRATION                            │
├─────────────────────────────────────────────────────────────┤
│ • Register patient as "WALK-IN"                             │
│ • Collect biodata (name, age, contact, address)            │
│ • DO NOT SELECT TESTS                                       │
│ • Set requiresClerkRequest = true                           │
│ • Status: "Pending"                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          Patient walks to Clerk
                     │
┌────────────────────▼────────────────────────────────────────┐
│ STEP 2: CLERK - CLINICAL ASSESSMENT                         │
├─────────────────────────────────────────────────────────────┤
│ • Patient describes symptoms                                │
│ • Clerk records clinical history                            │
│ • Clerk makes preliminary diagnosis                         │
│ • SELECT APPROPRIATE TESTS based on symptoms                │
│ • Create lab request form                                   │
│ • Status: "Awaiting Payment"                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
       Patient returns to Reception
                     │
┌────────────────────▼────────────────────────────────────────┐
│ STEP 3: RECEPTION - PAYMENT PROCESSING                      │
├─────────────────────────────────────────────────────────────┤
│ • Calculate total cost from lab request                     │
│ • Select payment method:                                    │
│   - Cash                                                    │
│   - Mobile Money (MTN/Airtel)                              │
│   - Insurance                                               │
│   - Card                                                    │
│ • Process payment                                           │
│ • Generate receipt                                          │
│                                                             │
│ 🔐 PAYMENT GATE ACTIVATED:                                  │
│    ✅ IF Full Payment:                                      │
│       → sampleCollectionStatus = "READY_FOR_COLLECTION"     │
│       → paymentStatus = "Paid"                              │
│       → overallStatus = "ReadyForCollection"                │
│       → Tell patient: "Go to Clerk for sample collection"  │
│                                                             │
│    ❌ IF Partial/No Payment:                                │
│       → Patient cannot proceed to sample collection         │
│       → Must complete payment first                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
       Patient returns to Clerk
                     │
┌────────────────────▼────────────────────────────────────────┐
│ STEP 4: CLERK - SAMPLE COLLECTION & QUALITY CONTROL         │
├─────────────────────────────────────────────────────────────┤
│ • Verify payment status = "Paid" ✅                         │
│ • Review required tests and samples                         │
│                                                             │
│ FOR EACH SAMPLE:                                            │
│                                                             │
│   A. Collect Sample                                         │
│      • Select correct container                             │
│      • Collect required volume                              │
│      • Label with patient ID, date, time                    │
│                                                             │
│   B. Quality Check #1: VOLUME                               │
│      ☑️ Sufficient volume collected?                        │
│      ☑️ Meets test requirements?                            │
│                                                             │
│   C. Quality Check #2: CONTAINER                            │
│      ☑️ Correct tube/container type?                        │
│      ☑️ Container in good condition?                        │
│      ☑️ No cracks or damage?                                │
│                                                             │
│   D. Quality Check #3: LABELING                             │
│      ☑️ Patient ID correct?                                 │
│      ☑️ Date and time recorded?                             │
│      ☑️ Sample type indicated?                              │
│                                                             │
│   E. Quality Check #4: INTEGRITY                            │
│      ☑️ No hemolysis (if blood)?                            │
│      ☑️ No clotting in EDTA tube?                           │
│      ☑️ No visible contamination?                           │
│      ☑️ Sample clarity acceptable?                          │
│                                                             │
│ • Record patient condition (fasting, hydrated, etc.)        │
│ • Add collection notes                                      │
│ • Mark as COLLECTED                                         │
│ • Status: "SampleCollected"                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
       Samples sent to Lab
                     │
┌────────────────────▼────────────────────────────────────────┐
│ STEP 5: LAB TECHNICIAN - TESTING                            │
├─────────────────────────────────────────────────────────────┤
│ • Receive samples from Clerk                                │
│ • Verify sample quality on receipt                          │
│ • Review quality check documentation                        │
│ • Process tests according to protocols                      │
│ • Enter results in system                                   │
│ • Status: "InProgress" → "Completed"                        │
│ • Submit for Owner approval                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
       Results approved by Owner
                     │
┌────────────────────▼────────────────────────────────────────┐
│ STEP 6: RECEPTION - REPORT DELIVERY                         │
├─────────────────────────────────────────────────────────────┤
│ • Print approved report                                     │
│ • Call patient for collection                               │
│ • Deliver report to patient                                 │
│ • Status: "Approved"                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📄 REFERRAL PATIENT DETAILED FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: RECEPTION - REGISTRATION WITH EXTERNAL FORM         │
├─────────────────────────────────────────────────────────────┤
│ • Patient presents with external lab request form           │
│ • Register patient as "REFERRAL"                            │
│ • Collect biodata                                           │
│ • Scan/upload external lab request form                     │
│ • Record referring doctor information                       │
│ • Status: "Pending"                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────▼────────────────────────────────────────┐
│ STEP 2: RECEPTION - TEST SELECTION                          │
├─────────────────────────────────────────────────────────────┤
│ • SELECT TESTS based on external form                       │
│ • Enter requested tests from doctor's form                  │
│ • Record clinical diagnosis from form                       │
│ • Calculate total cost                                      │
│ • Status: "Awaiting Payment"                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────▼────────────────────────────────────────┐
│ STEP 3: RECEPTION - PAYMENT PROCESSING                      │
├─────────────────────────────────────────────────────────────┤
│ • Process payment immediately                               │
│ • Generate receipt                                          │
│                                                             │
│ 🔐 PAYMENT GATE:                                            │
│    ✅ Full Payment → "READY_FOR_COLLECTION"                 │
│    → Tell patient: "Go to Clerk for sample collection"     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
       Patient walks to Clerk
                     │
┌────────────────────▼────────────────────────────────────────┐
│ STEP 4: CLERK - SAMPLE COLLECTION                           │
├─────────────────────────────────────────────────────────────┤
│ • Same quality control process as Walk-in                   │
│ • Verify samples match requested tests                      │
│ • Complete all 4 quality checks                             │
│ • Mark as COLLECTED                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────▼────────────────────────────────────────┐
│ STEP 5: LAB - TESTING                                       │
├─────────────────────────────────────────────────────────────┤
│ • Process tests                                             │
│ • Enter results                                             │
│ • Submit for approval                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────▼────────────────────────────────────────┐
│ STEP 6: RECEPTION - REPORT DELIVERY                         │
├─────────────────────────────────────────────────────────────┤
│ • Print and deliver report                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏥 INPATIENT DETAILED FLOW

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: RECEPTION - FACILITY TRANSFER                       │
├─────────────────────────────────────────────────────────────┤
│ • Patient presents facility ID                              │
│ • System auto-populates biodata from source facility        │
│ • Verify patient identity                                   │
│ • Review transfer order                                     │
│ • Pre-determined tests already loaded                       │
│ • Process payment                                           │
│                                                             │
│ 🔐 PAYMENT GATE: "READY_FOR_COLLECTION"                     │
│    → Tell patient: "Go to Clerk for sample collection"     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────▼────────────────────────────────────────┐
│ STEP 2: CLERK - SAMPLE COLLECTION                           │
├─────────────────────────────────────────────────────────────┤
│ • Follow transfer order specifications                      │
│ • Collect predetermined samples                             │
│ • Complete all quality checks                               │
│ • Document collection                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────▼────────────────────────────────────────┐
│ STEP 3: LAB - TESTING                                       │
├─────────────────────────────────────────────────────────────┤
│ • Process tests                                             │
│ • Enter results                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────▼────────────────────────────────────────┐
│ STEP 4: RECEPTION - REPORT DELIVERY                         │
├─────────────────────────────────────────────────────────────┤
│ • Deliver report to patient or source facility              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 PAYMENT GATE SYSTEM

```
                    PATIENT WORKFLOW
                           │
                           ▼
                   ┌───────────────┐
                   │  TESTS        │
                   │  SELECTED     │
                   └───────┬───────┘
                           │
                           ▼
                   ┌───────────────┐
                   │  PAYMENT      │
                   │  PROCESSING   │
                   └───────┬───────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼─────┐   ┌───▼────┐
              │  PAID IN  │   │PARTIAL │
              │   FULL    │   │  PAID  │
              └─────┬─────┘   └───┬────┘
                    │             │
                    │             │
         ┌──────────▼─────────┐   │
         │   🔓 GATE OPENS    │   │
         │                    │   │
         │ sampleCollection   │   │
         │ Status =           │   │
         │ READY_FOR_         │   │
         │ COLLECTION         │   │
         └──────────┬─────────┘   │
                    │             │
                    ▼             ▼
         ┌─────────────────┐  ┌──────────────┐
         │  CLERK CAN      │  │  🔒 GATE     │
         │  COLLECT        │  │  LOCKED      │
         │  SAMPLES        │  │              │
         │                 │  │  Patient     │
         │  Patient shows  │  │  must        │
         │  in collection  │  │  complete    │
         │  queue          │  │  payment     │
         └─────────────────┘  └──────────────┘
```

---

## 🧪 SAMPLE COLLECTION QUALITY CONTROL FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT ARRIVES AT CLERK                  │
│                    (After Payment Complete)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
             ┌───────────────┐
             │ System shows: │
             │ • Patient info│
             │ • Tests needed│
             │ • Samples req │
             └───────┬───────┘
                     │
                     ▼
       ┌─────────────────────────┐
       │ FOR EACH SAMPLE TYPE:   │
       └─────────────┬───────────┘
                     │
        ┌────────────▼────────────┐
        │   STEP 1: COLLECTION    │
        │  • Select container     │
        │  • Collect sample       │
        │  • Label immediately    │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ STEP 2: QUALITY CHECK 1 │
        │      VOLUME             │
        │  ☑️ Sufficient?         │
        │  ☑️ Meets requirement?  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ STEP 3: QUALITY CHECK 2 │
        │      CONTAINER          │
        │  ☑️ Correct type?       │
        │  ☑️ Good condition?     │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ STEP 4: QUALITY CHECK 3 │
        │      LABELING           │
        │  ☑️ Patient ID?         │
        │  ☑️ Date/Time?          │
        │  ☑️ Sample type?        │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │ STEP 5: QUALITY CHECK 4 │
        │      INTEGRITY          │
        │  ☑️ No hemolysis?       │
        │  ☑️ No clotting?        │
        │  ☑️ No contamination?   │
        └────────────┬────────────┘
                     │
            ┌────────┴────────┐
            │                 │
       ┌────▼────┐      ┌────▼────┐
       │ ALL QC  │      │  ANY QC │
       │ PASSED  │      │ FAILED  │
       └────┬────┘      └────┬────┘
            │                │
            ▼                ▼
     ┌──────────────┐  ┌──────────────┐
     │ STATUS:      │  │ STATUS:      │
     │ COLLECTED    │  │ REJECTED     │
     │              │  │              │
     │ → Next       │  │ → Document   │
     │   sample or  │  │   reason     │
     │   Complete   │  │ → Notify     │
     │              │  │   patient    │
     │              │  │ → Recollect  │
     └──────────────┘  └──────────────┘
```

---

## 📊 STATUS PROGRESSION CHART

```
OVERALL STATUS FLOW:
═══════════════════

Registration
     │
     ▼
[Pending] ────────────────────────────────────┐
     │                                        │
     │ (Walk-in → Clerk creates request)     │
     │ (Referral/Inpatient → Tests selected) │
     │                                        │
     ▼                                        │
[AwaitingPayment] ◄───────────────────────────┘
     │
     │ 💰 PAYMENT COMPLETED
     │
     ▼
[ReadyForCollection] ◄──── 🔐 PAYMENT GATE
     │
     │ 🧪 Clerk collects samples
     │
     ▼
[SampleCollected]
     │
     │ 📤 Sent to lab
     │
     ▼
[InLab]
     │
     │ 🔬 Lab processes
     │
     ▼
[InProgress]
     │
     │ ✅ Results entered
     │
     ▼
[Completed]
     │
     │ 👔 Owner approves
     │
     ▼
[Approved]
     │
     │ 📄 Report printed
     │
     ▼
[Delivered]


SAMPLE COLLECTION STATUS FLOW:
═══════════════════════════════

[PENDING]
     │
     │ 💰 Payment complete
     │
     ▼
[READY_FOR_COLLECTION]
     │
     │ 🧪 Clerk starts
     │
     ▼
[COLLECTING]
     │
     ├─── ✅ All QC Pass ───► [COLLECTED]
     │                             │
     └─── ❌ Any QC Fail ───► [REJECTED]
                                   │
                                   ▼
                            Recollection
                            Required
```

---

## 🎯 DECISION FLOWCHART

```
         PATIENT ARRIVES AT FACILITY
                    │
                    ▼
        ┌───────────────────────┐
        │ Has external          │
        │ lab request form      │
        │ from doctor?          │
        └───────┬───────────────┘
                │
        ┌───────┴───────┐
        │               │
       YES             NO
        │               │
        ▼               ▼
   ┌─────────┐    ┌─────────────┐
   │REFERRAL │    │From facility│
   └────┬────┘    │network?     │
        │         └──────┬──────┘
        │                │
        │         ┌──────┴──────┐
        │         │             │
        │        YES           NO
        │         │             │
        │         ▼             ▼
        │    ┌─────────┐  ┌─────────┐
        │    │INPATIENT│  │WALK-IN  │
        │    └────┬────┘  └────┬────┘
        │         │             │
        └─────────┴─────────────┘
                  │
                  ▼
         Follow appropriate
         workflow pathway
```

---

## 🔄 SAMPLE TYPE TO TEST MAPPING

```
BLOOD (EDTA - Purple Top)
═════════════════════════
├─ Full Hemogram (FBC)
├─ Malaria Parasite (MP)
├─ Blood Group & Rh
├─ ESR
├─ Reticulocyte Count
├─ HbA1c
└─ HIV Rapid Test


BLOOD (Serum - Red/Gold Top)
════════════════════════════
├─ Liver Function Tests (LFT)
├─ Renal Function Tests (RFT)
├─ Lipid Profile
├─ Thyroid Function Tests (TFT)
├─ PSA Total
├─ Beta HCG
├─ Hepatitis B (HBsAg)
├─ Hepatitis C (HCV)
└─ RPR (Syphilis)


BLOOD (Fluoride - Grey Top)
═══════════════════════════
└─ Blood Glucose (Fasting/Random)


URINE (Sterile Container)
═════════════════════════
└─ Urine Microscopy & Analysis


STOOL (Stool Container)
══════════════════════
└─ Stool Microscopy & O&P


SPUTUM (Sputum Container)
════════════════════════
└─ TB GeneXpert


SWAB (Swab Kit)
══════════════
├─ COVID-19 Antigen
└─ Culture & Sensitivity
```

---

## 📍 PHYSICAL PATIENT FLOW IN FACILITY

```
                FACILITY LAYOUT
    ┌─────────────────────────────────┐
    │         ENTRANCE                 │
    └─────────────┬───────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────┐
    │      🔵 RECEPTION DESK           │
    │  • Patient Registration          │
    │  • Payment Processing            │
    │  • Report Delivery               │
    └─────────────┬───────────────────┘
                  │
         ┌────────┼────────┐
         │                 │
         ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│  WAITING     │  │  🟢 CLERK OFFICE │
│  AREA        │  │  • Consultations │
│              │  │  • Lab Requests  │
│              │  │  • Sample        │
│              │  │    Collection    │
└──────────────┘  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  🔬 LABORATORY   │
                  │  • Sample        │
                  │    Processing    │
                  │  • Testing       │
                  │  • Results Entry │
                  └──────────────────┘
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-30  
**Print:** A4 Landscape for best viewing

---

*🖨️ Print these diagrams for wall display at each workstation*  
*📱 Keep digital version accessible on mobile devices*  
*🔄 Review regularly during staff meetings*
