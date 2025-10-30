# 🏥 LabSync Workflow Quick Reference Guide

## 📱 STAFF QUICK REFERENCE

---

## 🔵 RECEPTION STAFF

### 🆕 NEW PATIENT REGISTRATION

#### **Step 1: Identify Patient Type**

**Ask the patient:**
> "Do you have a lab request form from a doctor?"

| Answer | Patient Type | Action |
|--------|-------------|---------|
| **"No, I just came to get tested"** | 🚶 WALK-IN | Click **Walk-in Patient** button |
| **"Yes, here is my form from Dr. ___"** | 📄 REFERRAL | Click **Referral Patient** button |
| **"I'm from [Facility Name]"** | 🏥 INPATIENT | Click **Inpatient/Transfer** button |

---

### 🚶 WALK-IN PATIENT
**No lab request form**

#### What to Do:
1. ✅ Register patient with full biodata
2. ✅ Collect contact information
3. ❌ **DO NOT select tests**
4. ✅ Save and **send patient to CLERK**
5. ✅ Tell patient: *"Please go to the Clerk for clinical assessment"*

#### After Clerk Creates Lab Request:
6. ✅ Patient returns with test recommendation
7. ✅ Process payment
8. ✅ Tell patient: *"Please return to Clerk for sample collection"*

**Flow:** Reception → Clerk → Reception → Clerk → Lab → Reception

---

### 📄 REFERRAL PATIENT
**Has external lab request form**

#### What to Do:
1. ✅ Register patient with full biodata
2. ✅ Upload/scan the external lab request form
3. ✅ **SELECT TESTS** from the external form
4. ✅ Enter referring doctor's name
5. ✅ Process payment immediately
6. ✅ Tell patient: *"Please go to Clerk for sample collection"*

**Flow:** Reception → Reception → Clerk → Lab → Reception

---

### 🏥 INPATIENT/TRANSFER
**From our facility network**

#### What to Do:
1. ✅ Enter patient's facility ID
2. ✅ System auto-fills biodata
3. ✅ Verify patient identity
4. ✅ Tests already pre-selected from transfer
5. ✅ Process payment
6. ✅ Tell patient: *"Please go to Clerk for sample collection"*

**Flow:** Reception → Clerk → Lab → Reception

---

### 💰 PAYMENT PROCESSING

#### Important Rules:
- ✅ **Full payment must be completed** before sample collection
- ⚠️ Partial payment = Patient must wait
- ✅ After full payment, system automatically enables sample collection
- ✅ Tell patient: *"Your payment is complete. Please go to the Clerk for sample collection"*

#### Payment Methods:
- Cash
- MTN Mobile Money
- Airtel Money
- Insurance
- Card

---

## 🟢 CLERK STAFF

### 👥 WALK-IN PATIENTS (Lab Request Creation)

#### Your Role:
1. ✅ Assess patient's symptoms and complaints
2. ✅ Record clinical history
3. ✅ Make preliminary diagnosis
4. ✅ **Select appropriate tests** based on symptoms
5. ✅ Send patient back to Reception for payment

**Where to Find:** Dashboard → Walk-in Patients

---

### 🧪 SAMPLE COLLECTION (ALL Patient Types)

#### Who Can You Collect From:
✅ **ONLY patients who have PAID in full**  
❌ Cannot collect from unpaid patients

#### Sample Collection Process:

**Step 1: Select Patient**
- Choose patient from "Pending Sample Collection" list
- System shows required tests and samples

**Step 2: For Each Sample**

**Quality Checks (Must Complete ALL):**
1. ☑️ **Volume Check**
   - Measure sample volume
   - Click "Sufficient" or "Insufficient"

2. ☑️ **Container Check**
   - Verify correct tube/container
   - Purple tube = EDTA (blood count tests)
   - Red tube = Serum (chemistry tests)
   - Grey tube = Fluoride (glucose)
   - Click "Pass" or "Fail"

3. ☑️ **Labeling Check**
   - Verify patient ID on label
   - Verify date and time
   - Click "Pass" or "Fail"

4. ☑️ **Integrity Check**
   - Look for hemolysis (red/pink color in serum)
   - Look for clotting in EDTA tube
   - Look for contamination
   - Click appropriate status

**Step 3: Patient Condition Notes**
- Record if patient is fasting
- Note if patient is dehydrated
- Any other relevant observations

**Step 4: Complete Collection**
- Review all samples
- Click "Complete Collection"
- Samples automatically sent to Lab

---

### 📊 Sample Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ COLLECTED | Good sample | Send to lab |
| ⚠️ INSUFFICIENT | Not enough volume | Recollect |
| ❌ HEMOLYZED | Blood damaged | Recollect |
| ❌ CLOTTED | Blood clotted | Recollect |
| ❌ CONTAMINATED | Sample contaminated | Recollect |

---

### 🧪 Common Samples Quick Guide

| Sample Type | Container | Tests |
|-------------|-----------|-------|
| **Blood (EDTA)** | Purple Top | FBC, MP, Blood Group, HIV |
| **Blood (Serum)** | Red/Gold Top | LFT, RFT, Lipids, Hepatitis |
| **Blood (Fluoride)** | Grey Top | Glucose (fasting/random) |
| **Urine** | Sterile Cup | Urine analysis, microscopy |
| **Stool** | Stool Container | Stool analysis, O&P |
| **Sputum** | Sputum Container | TB GeneXpert |

---

## 🔬 LAB TECHNICIAN STAFF

### 📥 Receiving Samples

#### Where to Look:
- Dashboard → **Samples Ready** (purple card)
- Shows number of samples collected and ready for processing

#### What You See:
- ✅ Samples that passed quality checks
- ✅ Collection date and time
- ✅ Clerk who collected
- ✅ Quality check details
- ✅ Patient information

#### Important:
- Only samples with status "COLLECTED" or "SENT_TO_LAB"
- All samples already passed clerk quality checks
- Sample quality details available for review

---

### 🧪 Processing Tests

#### Workflow:
1. ✅ View samples ready for processing
2. ✅ Collect samples from Clerk
3. ✅ Perform tests according to protocols
4. ✅ Enter results in system
5. ✅ Submit for Owner approval

---

## 🚦 STATUS INDICATORS

### Sample Collection Status

| Status | Meaning | Who Can See |
|--------|---------|-------------|
| 🟡 PENDING | Awaiting payment | Reception |
| 🟢 READY_FOR_COLLECTION | Paid, ready for clerk | Clerk |
| 🔵 COLLECTING | Clerk in process | Clerk |
| ✅ COLLECTED | Samples collected & QC passed | Lab Tech |
| ❌ REJECTED | Failed quality checks | Clerk |
| 📤 SENT_TO_LAB | In lab for processing | Lab Tech |

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### "Patient not showing in sample collection queue"
**Cause:** Payment not completed  
**Solution:** Complete payment in full at Reception

### "Cannot proceed with sample collection"
**Cause:** Quality checks not all passed  
**Solution:** Complete all 4 quality checks

### "Sample rejected - what now?"
**Solution:** 
1. Document rejection reason
2. Note which samples need recollection
3. Inform patient
4. Recollect samples

### "Patient waiting too long"
**Check:**
- [ ] Is payment complete?
- [ ] Is status "READY_FOR_COLLECTION"?
- [ ] Are samples collected?
- [ ] Did clerk mark as complete?

---

## 📞 EMERGENCY PROCEDURES

### 🚨 STAT/URGENT Tests
- Look for **red label** "STAT" or **orange label** "Urgent"
- Process immediately
- Notify lab tech
- Fast-track through all stages

### 🩸 Critical Sample Issues
- **Hemolyzed blood:** Notify clerk immediately, recollect
- **Insufficient volume:** Recollect before patient leaves
- **Wrong container:** Recollect immediately
- **No label:** STOP - label before proceeding

---

## 💡 BEST PRACTICES

### Reception
- ✅ Verify patient type before registration
- ✅ Double-check mobile money transactions
- ✅ Print payment receipt
- ✅ Give clear directions to next station

### Clerk
- ✅ Verify payment before collecting samples
- ✅ Complete ALL quality checks
- ✅ Label samples immediately after collection
- ✅ Document any issues clearly
- ✅ Store samples properly while waiting for lab

### Lab Tech
- ✅ Check sample quality on receipt
- ✅ Report any concerns to supervisor
- ✅ Follow testing protocols exactly
- ✅ Enter results promptly

---

## 🎯 KEY REMINDERS

### For ALL Staff:

1. **PAYMENT GATE:**  
   🔒 No sample collection without full payment  
   🔓 Full payment = automatic unlock

2. **QUALITY FIRST:**  
   ✅ All quality checks must pass  
   ❌ Never skip quality procedures

3. **DOCUMENTATION:**  
   📝 Document everything  
   ⏰ Timestamps are automatic

4. **PATIENT COMMUNICATION:**  
   💬 Keep patient informed  
   🗺️ Give clear directions  
   ⏱️ Manage expectations

---

## 📊 DAILY CHECKLIST

### Reception Opening:
- [ ] Log into system
- [ ] Check pending payments from previous day
- [ ] Review reports ready for collection
- [ ] Prepare registration area

### Clerk Opening:
- [ ] Check walk-in patient queue
- [ ] Check sample collection queue
- [ ] Ensure sample collection supplies stocked
- [ ] Verify cold storage working

### Lab Opening:
- [ ] Check samples ready for processing
- [ ] Review urgent/STAT tests
- [ ] Calibrate equipment
- [ ] Review quality control logs

---

## 🆘 NEED HELP?

### System Issues:
- Check internet connection
- Refresh browser
- Clear cache
- Contact IT support

### Workflow Questions:
- Refer to this guide
- Ask supervisor
- Check training materials

### Emergency:
- Contact facility manager
- Follow emergency protocols
- Document incident

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2025-10-30

---

*📍 Keep this guide accessible at all times*  
*🖨️ Print and post at each workstation*  
*📱 Bookmark digital version on your device*
