# 🏥 LabSync Multi-Facility Management System

## 📋 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [User Roles & Permissions](#user-roles--permissions)
- [Module Documentation](#module-documentation)
- [Usage Guide](#usage-guide)
- [Data Models](#data-models)
- [Integration Guide](#integration-guide)

---

## 🎯 Overview

The LabSync Multi-Facility Management System is a comprehensive solution designed for laboratory owners to manage multiple facilities from a single dashboard with real-time data isolation, financial tracking, inventory management, and HR oversight.

### Core Capabilities
- **Real-time Facility Switching**: Seamlessly switch between facilities or view consolidated data
- **Financial Management**: Track income, expenses, profits with Uganda-specific payment methods
- **Inventory Control**: Automated stock tracking with consumable usage recording
- **HR & Attendance**: Employee check-in/out, leave management, performance metrics
- **Advanced Analytics**: Multi-facility comparison and performance insights

---

## 🚀 Key Features

### 1. Interactive Facility Selector
```typescript
// Automatically filters all data by selected facility
selectedFacility: 'all' | facilityId
```
- Click any facility to view its isolated data
- "All Facilities" option for consolidated view
- Real-time data synchronization

### 2. Financial Management Module

#### Income Tracking
- **Cash payments**: Direct cash transactions
- **Mobile Money**: MTN & Airtel tracking
- **Insurance**: Insurance claim processing
- **Card payments**: Credit/debit cards

#### Expense Management
Categories include:
- Consumables
- Salaries
- Utilities
- Maintenance
- Rent
- Equipment
- Marketing
- Other

#### Financial Metrics
- Gross Income
- Total Expenses
- Net Profit
- Tax Calculations (30% Uganda standard)
- Profit Margin Analysis

### 3. Inventory & Consumables System

#### Features
- **Automatic Stock Deduction**: When tests are performed or samples collected
- **Low Stock Alerts**: Real-time notifications
- **Multi-level Alerts**:
  - Critical: Out of stock
  - High: < 50% of minimum
  - Medium: At minimum level
  
#### Consumable Categories
- Test Kits (RDT strips, reagents)
- Sample Containers (tubes, cups)
- Safety Equipment (gloves, masks)
- Reagents (chemical solutions)
- Disposables (syringes, swabs)

### 4. HR & Attendance Management

#### Attendance System
```typescript
// Employee must check-in before system access
CheckIn -> System Access -> CheckOut
```

#### Features
- Mandatory check-in/check-out
- Automatic late marking (after 9 AM)
- Real-time hours calculation
- Attendance reports

#### Leave Management
- Annual leave
- Sick leave
- Maternity/Paternity
- Compassionate leave
- Unpaid leave

**Workflow**: Apply → Pending → Owner Approval/Rejection

### 5. Analytics & Reporting

#### Metrics Tracked
- Patient volume per facility
- Revenue generation
- Test completion rates
- Staff productivity
- Inventory turnover
- Profit margins

#### Export Capabilities
- CSV export for Excel analysis
- Date range filtering
- Multi-facility comparison

---

## 🏗️ System Architecture

### Database Collections

```
facilities/
├── {facilityId}
│   ├── name
│   ├── code
│   ├── address
│   └── ...

inventory_items/
├── {itemId}
│   ├── facilityId (indexed)
│   ├── currentStock
│   ├── minimumStock
│   └── ...

consumable_usage/
├── {usageId}
│   ├── facilityId (indexed)
│   ├── inventoryItemId
│   ├── testResultId
│   ├── quantity
│   └── ...

attendance_records/
├── {recordId}
│   ├── facilityId (indexed)
│   ├── employeeId
│   ├── date (indexed)
│   ├── checkIn
│   ├── checkOut
│   └── ...

expenditures/
├── {expenseId}
│   ├── facilityId (indexed)
│   ├── category
│   ├── amount
│   └── ...
```

### Data Isolation Strategy

All queries include facility filtering:
```typescript
const query = facilityId === 'all' 
  ? collection(db, COLLECTION_NAME)
  : query(collection(db, COLLECTION_NAME), where('facilityId', '==', facilityId))
```

---

## 👥 User Roles & Permissions

### Owner (Full Access)
- ✅ View all facilities
- ✅ Approve test results
- ✅ Manage finances
- ✅ Review expenses
- ✅ Approve leaves
- ✅ View analytics
- ✅ Manage inventory
- ✅ Create facilities

### Lab Technician
- ✅ Check-in/check-out
- ✅ Record consumable usage during testing
- ✅ Enter test results
- ✅ View inventory (read-only)
- ❌ Cannot approve results
- ❌ Cannot view finances

### Clerk/Sample Collection
- ✅ Check-in/check-out
- ✅ Record consumable usage during sample collection
- ✅ Receive samples
- ✅ Perform QC checks
- ❌ Cannot enter results
- ❌ Cannot view finances

### Receptionist
- ✅ Check-in/check-out
- ✅ Register patients
- ✅ Process payments
- ✅ Generate invoices
- ❌ Cannot access lab functions
- ❌ Cannot view full analytics

---

## 📚 Module Documentation

### Financial Management

#### Recording Income
Income is automatically tracked from payments but can be manually recorded:

```typescript
// Manual income entry
POST /api/daily-income
{
  facilityId: string,
  date: string,
  cash: number,
  mobileMoney: { mtn: number, airtel: number },
  insurance: number,
  card: number
}
```

#### Recording Expenses

Owner can add expenses through the UI:

1. Click "Add Expense" in Financial Management
2. Select category
3. Enter amount (UGX)
4. Add description
5. Select date
6. Submit

**Example Categories**:
- Consumables: Stock purchases
- Salaries: Staff payments
- Utilities: Electricity, water
- Maintenance: Equipment repairs

### Inventory Management

#### Adding New Items

```typescript
{
  name: "Malaria RDT Strips",
  category: "test_kits",
  currentStock: 100,
  minimumStock: 50,
  unit: "strips",
  costPerUnit: 2000, // UGX
  supplier: "Medical Suppliers Ltd"
}
```

#### Recording Usage

**For Lab Technicians** (during testing):
```typescript
<ConsumableUsageModal
  isOpen={true}
  testResultId="result_123"
  usageType="test"
  onClose={() => {}}
/>
```

**For Clerks** (during sample collection):
```typescript
<ConsumableUsageModal
  isOpen={true}
  testRequestId="request_456"
  usageType="sample_collection"
  onClose={() => {}}
/>
```

#### Stock Alerts

System automatically generates alerts when:
- Stock reaches minimum level → Medium priority
- Stock < 50% of minimum → High priority
- Stock = 0 → Critical priority

### HR & Attendance

#### Check-In Process

```typescript
// Component usage
import CheckInOut from '@/components/attendance/CheckInOut';

<CheckInOut />
```

**Workflow**:
1. Employee opens dashboard
2. Must check-in before accessing system
3. System records:
   - Check-in time
   - IP address (optional)
   - Status (present/late)
4. Automatic check-out reminder at end of day

#### Leave Management

**Application Process**:
1. Employee navigates to leave request
2. Fills form:
   - Leave type
   - Start date
   - End date
   - Reason
3. Submits application
4. Owner receives notification
5. Owner approves/rejects with notes

**Leave Types**:
- Annual: Yearly vacation
- Sick: Medical reasons
- Maternity: 60 days (Uganda law)
- Paternity: 4 days (Uganda law)
- Compassionate: Family emergencies
- Unpaid: Without salary

---

## 📖 Usage Guide

### For Owners

#### Viewing Facility Data

1. **Select Facility**:
   ```
   Dashboard → Click facility button → Data updates automatically
   ```

2. **View All Facilities**:
   ```
   Dashboard → Click "All Facilities" → See consolidated data
   ```

#### Approving Expenses

```
Financial Management → Recent Expenses → Review → Approve/Reject
```

#### Managing Low Stock

```
Inventory → Stock Alerts → Select Item → Restock → Enter Quantity → Confirm
```

#### Reviewing Leave Requests

```
HR Management → Leave Management → Pending Requests → Approve/Reject
```

### For Lab Technicians

#### Recording Test Results with Consumables

1. Enter test results as normal
2. After entering results, system prompts for consumables
3. Click "Record Consumables Used"
4. Search and select items (e.g., "Malaria RDT")
5. Adjust quantity if needed
6. Add notes (optional)
7. Submit

**Example**:
```
Test: Malaria RDT
Consumables Used:
- Malaria RDT Strip: 1 strip
- Gloves: 1 pair
- Alcohol Swab: 2 pieces
```

### For Clerks

#### Sample Collection with Consumables

1. Receive sample from patient
2. Record sample details
3. System prompts for consumables
4. Select items used:
   - EDTA tube
   - Needle
   - Gloves
   - Label
5. Submit usage record

### For All Staff

#### Daily Check-In

```
1. Open dashboard
2. Check-in widget appears
3. Click "Check In Now"
4. System grants access
5. At end of day, click "Check Out"
```

---

## 📊 Data Models

### Inventory Item
```typescript
interface InventoryItem {
  id: string;
  facilityId: string;
  name: string;
  category: 'test_kits' | 'sample_containers' | 'safety_equipment' | 'reagents' | 'disposables' | 'other';
  currentStock: number;
  minimumStock: number;
  unit: string;
  costPerUnit: number;
  supplier?: string;
  testsUsing: string[]; // Test IDs
  isActive: boolean;
}
```

### Consumable Usage
```typescript
interface ConsumableUsage {
  id: string;
  facilityId: string;
  inventoryItemId: string;
  testResultId?: string;
  testRequestId?: string;
  quantity: number;
  usedBy: string; // User ID
  usageType: 'test' | 'sample_collection' | 'quality_control' | 'other';
  notes?: string;
  date: Date;
}
```

### Attendance Record
```typescript
interface AttendanceRecord {
  id: string;
  employeeId: string;
  facilityId: string;
  date: string; // YYYY-MM-DD
  checkIn?: Date;
  checkOut?: Date;
  hoursWorked: number;
  status: 'present' | 'absent' | 'late' | 'on_leave' | 'half_day';
  notes?: string;
}
```

### Expenditure
```typescript
interface Expenditure {
  id: string;
  facilityId: string;
  category: 'consumables' | 'salaries' | 'utilities' | 'maintenance' | 'rent' | 'equipment' | 'marketing' | 'other';
  amount: number;
  description: string;
  date: Date;
  approvedBy?: string;
  receipt?: string; // Storage URL
  createdBy: string;
}
```

---

## 🔗 Integration Guide

### Adding Consumable Recording to Existing Workflows

#### Lab Tech Result Entry

```typescript
import ConsumableUsageModal from '@/components/consumables/ConsumableUsageModal';

function ResultEntryPage() {
  const [showConsumables, setShowConsumables] = useState(false);
  const [resultId, setResultId] = useState<string>();

  const handleResultSubmit = async (resultData) => {
    // Save result first
    const result = await saveTestResult(resultData);
    setResultId(result.id);
    
    // Prompt for consumables
    setShowConsumables(true);
  };

  return (
    <>
      {/* Result entry form */}
      <ConsumableUsageModal
        isOpen={showConsumables}
        onClose={() => setShowConsumables(false)}
        testResultId={resultId}
        usageType="test"
      />
    </>
  );
}
```

#### Clerk Sample Collection

```typescript
import ConsumableUsageModal from '@/components/consumables/ConsumableUsageModal';

function SampleCollectionPage() {
  const [showConsumables, setShowConsumables] = useState(false);
  const [requestId, setRequestId] = useState<string>();

  const handleSampleReceive = async (sampleData) => {
    // Record sample receipt
    const request = await recordSampleReceipt(sampleData);
    setRequestId(request.id);
    
    // Prompt for consumables
    setShowConsumables(true);
  };

  return (
    <>
      {/* Sample collection form */}
      <ConsumableUsageModal
        isOpen={showConsumables}
        onClose={() => setShowConsumables(false)}
        testRequestId={requestId}
        usageType="sample_collection"
      />
    </>
  );
}
```

### Adding Check-In Widget to Dashboard

```typescript
import CheckInOut from '@/components/attendance/CheckInOut';

function StaffDashboard() {
  return (
    <DashboardLayout>
      {/* Check-in widget at top */}
      <CheckInOut />
      
      {/* Rest of dashboard */}
      <div className="mt-6">
        {/* Dashboard content */}
      </div>
    </DashboardLayout>
  );
}
```

---

## 🎨 UI Components

### Facility Selector
```typescript
<div className="grid grid-cols-4 gap-3">
  <button onClick={() => setFacility('all')}>
    All Facilities
  </button>
  {facilities.map(f => (
    <button onClick={() => setFacility(f.id)}>
      {f.name}
    </button>
  ))}
</div>
```

### Financial Summary Cards
- Total Income (Green)
- Total Expenses (Red)
- Net Profit (Blue)
- Tax Estimate (Purple)

### Stock Alert Badges
- Critical (Red): Out of stock
- High (Orange): Very low
- Medium (Yellow): Low stock
- Low (Blue): Near minimum

---

## 🔒 Security & Data Privacy

### Access Control
- Role-based permissions enforced at Firebase rules level
- Facility-based data isolation
- Owner-only financial data access

### Data Segregation
```typescript
// All queries automatically filtered by facility
where('facilityId', '==', userProfile.facilityId)

// Owner can override
facilityId === 'all' ? allData : filteredData
```

### Audit Logging
All critical actions logged:
- Expense approvals
- Stock adjustments
- Leave approvals
- System access

---

## 📈 Reporting Features

### Available Reports
1. **Financial Summary**
   - Income breakdown
   - Expense analysis
   - Profit/loss statements
   - Tax calculations

2. **Inventory Reports**
   - Stock levels
   - Usage patterns
   - Reorder recommendations
   - Cost analysis

3. **HR Reports**
   - Attendance records
   - Leave balances
   - Staff productivity
   - Payroll summaries

4. **Analytics Dashboard**
   - Multi-facility comparison
   - Performance trends
   - Key insights
   - Growth metrics

### Export Options
- CSV export for all reports
- Date range filtering
- Facility-specific or consolidated
- Custom columns selection

---

## 🚦 Status Indicators

### System Status
- 🟢 Green: Operational
- 🟡 Yellow: Warning
- 🔴 Red: Critical
- ⚪ Gray: Inactive

### Stock Status
- ✅ In Stock: Above minimum
- ⚠️ Low Stock: At minimum
- 🔴 Critical: Below 50% of minimum
- ❌ Out of Stock: Zero stock

### Attendance Status
- ✅ Present: On time
- ⏰ Late: After 9 AM
- ❌ Absent: No check-in
- 🏖️ On Leave: Approved leave
- 🕐 Half Day: Partial attendance

---

## 📞 Support & Maintenance

### Common Issues

**Issue**: Consumables not deducting from stock
**Solution**: Ensure ConsumableUsageModal is properly submitted

**Issue**: Check-in not working
**Solution**: Verify employee record exists in EMPLOYEES collection

**Issue**: Financial data not showing
**Solution**: Check facility selection and permissions

### Best Practices

1. **Daily Operations**
   - Check-in at start of day
   - Record consumables immediately after use
   - Review stock alerts daily
   - Check-out at end of day

2. **Weekly Tasks**
   - Review financial reports
   - Process leave requests
   - Restock low inventory
   - Verify attendance records

3. **Monthly Reviews**
   - Analyze facility performance
   - Review expenses
   - Calculate tax obligations
   - Audit inventory

---

## 🎯 Future Enhancements

### Planned Features
- [ ] Mobile app for staff check-in
- [ ] Automated reorder system
- [ ] SMS notifications for alerts
- [ ] Performance bonuses calculation
- [ ] Advanced predictive analytics
- [ ] Integration with Uganda Revenue Authority (URA)
- [ ] Multi-currency support
- [ ] Biometric attendance
- [ ] AI-powered inventory forecasting
- [ ] Custom report builder

---

## 📝 Changelog

### Version 1.0.0 (2025-10-30)
- ✨ Initial release
- ✅ Multi-facility management
- ✅ Financial tracking
- ✅ Inventory management
- ✅ HR & attendance system
- ✅ Analytics dashboard
- ✅ Consumable usage recording
- ✅ Facility creation automation

---

## 👨‍💻 Development Team

**Built with** ❤️ **for Ugandan laboratories**

**Technology Stack**:
- Next.js 14
- Firebase Firestore
- TypeScript
- Tailwind CSS
- React Query

---

## 📄 License

Copyright © 2025 LabSync. All rights reserved.

---

**For technical support or feature requests, contact your system administrator.**
