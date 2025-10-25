# LabSync Setup & Management Guide

## 🚀 Initial Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase
Create a `.env.local` file with your Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Seed Initial Data
After starting the development server, visit:
```
http://localhost:3000/api/seed-initial-data
```

This will create:
- **3 Demo Facilities** (FIRSTLINE - NTUNGAMO, FIRSTLINE - MBARARA, PRIMECURE MEDICAL)
- **6 Test Categories** (Hematology, Clinical Chemistry, Microbiology, etc.)
- **4 Demo Users** (Owner, Receptionist, Clerk, Lab Technician)

### 4. Run Development Server
```bash
npm run dev
```

## 👤 Demo User Credentials

| Role | Email | Password | Dashboard Access |
|------|-------|----------|-----------------|
| **Owner/Admin** | owner@labsync.ug | password123 | Full system access + management |
| **Receptionist** | reception@labsync.ug | password123 | Patient registration, payments |
| **Clerk** | clerk@labsync.ug | password123 | Sample reception, test selection |
| **Lab Technician** | labtech@labsync.ug | password123 | Test processing, result entry |

## 🔐 Owner Management Features

### 1. User Management (`/dashboard/owner/users`)

**Accessible by:** Owner only

**Features:**
- ✅ Add new users with login credentials
- ✅ Assign roles (Owner, Receptionist, Clerk, Lab Technician)
- ✅ Assign users to specific facilities
- ✅ View all active users
- ✅ Deactivate users
- ✅ Search users by name, email, or role

**How to Add a New User:**
1. Navigate to Owner Dashboard
2. Click "Manage Users" card
3. Click "Add New User" button
4. Fill in user details:
   - First Name & Last Name
   - Email (will be used for login)
   - Password (minimum 6 characters)
   - Phone Number
   - Role (determines dashboard access)
   - Facility (user's assigned location)
5. Click "Create User"
6. **IMPORTANT:** Save the login credentials displayed in the success message
7. Share credentials securely with the new user

**Role-Based Dashboard Routing:**
- When users log in, they are automatically routed to their role-specific dashboard
- **Owner** → `/dashboard/owner` (multi-facility overview + management tools)
- **Receptionist** → `/dashboard/reception` (patient registration, payments)
- **Clerk** → `/dashboard/clerk` (sample reception, test selection)
- **Lab Technician** → `/dashboard/lab-tech` (test processing, results)

---

### 2. Test Management (`/dashboard/owner/tests`)

**Accessible by:** Owner only

**Features:**
- ✅ Add new laboratory tests
- ✅ Import multiple tests via CSV
- ✅ Set test pricing in UGX
- ✅ Define sample types and requirements
- ✅ View all active tests
- ✅ Deactivate tests
- ✅ Search tests by name, code, or sample type

**How to Add a Single Test:**
1. Navigate to Owner Dashboard
2. Click "Manage Tests" in Management Tools section
3. Click "Add New Test" button
4. Fill in test details:
   - Test Code (e.g., MAL, HIV, LFT)
   - Test Name (e.g., Malaria Test)
   - Category (select from existing categories)
   - Price in UGX (e.g., 15000)
   - Turnaround Time (e.g., "2 hours", "24 hours")
   - Sample Type (Blood, Urine, Stool, etc.)
   - Container Type (e.g., EDTA tube)
   - Storage Requirements (e.g., "Store at 2-8°C")
5. Click "Add Test"

**How to Import Multiple Tests (CSV):**
1. Click "Import Tests" button
2. Prepare your CSV data with this format:
```csv
code,name,categoryId,price,turnaroundTime,sampleType,containerType,storageRequirements
MAL,Malaria Test,category_id_here,15000,2 hours,Blood,EDTA tube,Room temp
HIV,HIV Test,category_id_here,25000,1 hour,Blood,EDTA tube,2-8°C
LFT,Liver Function Test,category_id_here,35000,4 hours,Blood,SST tube,2-8°C
```
3. Paste the CSV data into the text area
4. Click "Import Tests"
5. Tests are immediately added to the database

**Note:** To get category IDs, navigate to Firestore Console → test_categories collection

---

### 3. Facility Management (`/dashboard/owner/facilities`)

**Accessible by:** Owner only

**Features:**
- ✅ Add new laboratory facilities/locations
- ✅ Edit existing facility information
- ✅ View all facilities in a grid layout
- ✅ Search facilities by name, code, or address
- ✅ Manage facility status (active/inactive)

**How to Add a New Facility:**
1. Navigate to Owner Dashboard
2. Click "Facilities" card
3. Click "Add New Facility" button
4. Fill in facility details:
   - Facility Name (e.g., "FIRSTLINE - KAMPALA")
   - Facility Code (2-4 characters, used in patient IDs, e.g., "FLKA")
   - Address (full physical address)
   - Phone Number (Uganda format: +256 700 000 000)
   - Email (facility contact email)
   - License Number (e.g., "UG-LAB-2024-FLKA")
5. Click "Add Facility"

**How to Edit Facility Information:**
1. Navigate to Facilities page
2. Click the edit icon (pencil) on any facility card
3. Update the desired information
4. Click "Update Facility"

**Important Notes:**
- Facility Code is used to generate patient IDs (e.g., FLNT-00123)
- Keep facility codes short and unique
- Facility information appears on all printed reports

---

## 🔄 User Role Workflow

### **Owner/Admin Responsibilities:**
1. **System Configuration**
   - Add and manage users
   - Set up facilities
   - Configure test menu and pricing
   
2. **Final Approval**
   - Review and approve all lab test results
   - Ensure quality control
   
3. **Multi-Facility Oversight**
   - Monitor performance across all locations
   - View combined financial reports
   - Track pending approvals system-wide

4. **User Management**
   - Create accounts for new staff
   - Assign roles and permissions
   - Deactivate departing staff

---

### **Receptionist Responsibilities:**
1. **Patient Registration**
   - Collect complete biodata
   - Generate patient ID (e.g., FLNT-00123)
   
2. **Payment Processing**
   - Calculate test fees
   - Process payments (Cash, Mobile Money, Insurance)
   - Issue receipts
   
3. **Report Printing**
   - Print test request forms
   - Print final lab reports for patients

---

### **Clerk Responsibilities:**
1. **Sample Reception**
   - Verify patient samples
   - Label samples correctly
   
2. **Test Selection**
   - Determine required tests from doctor's orders
   - Map external hospital forms to system tests
   
3. **Workflow Coordination**
   - Add clerk notes and observations
   - Bridge reception and laboratory

---

### **Lab Technician Responsibilities:**
1. **Test Processing**
   - Perform laboratory analyses
   - Follow standard operating procedures
   
2. **Result Entry**
   - Input test results with normal ranges
   - Flag abnormal values
   
3. **Quality Control**
   - Ensure equipment calibration
   - Submit results for owner approval

---

## 🔒 Security Features

### Role-Based Access Control
- Each management page is protected by role guards
- Users can only access features appropriate to their role
- Automatic redirection to correct dashboard on login

### Authentication Flow
1. User enters email and password
2. System authenticates via Firebase
3. User profile fetched from Firestore
4. User routed to role-specific dashboard
5. Role guard prevents access to unauthorized pages

---

## 📊 Database Collections

### Users Collection (`users`)
```javascript
{
  id: "user_uid",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "receptionist", // owner, receptionist, clerk, lab_tech
  facilityId: "facility_id",
  phone: "+256 700 000 000",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Tests Collection (`tests`)
```javascript
{
  id: "test_id",
  code: "MAL",
  name: "Malaria Test",
  categoryId: "category_id",
  price: 15000, // UGX
  turnaroundTime: "2 hours",
  sampleType: "Blood",
  containerType: "EDTA tube",
  storageRequirements: "Room temp",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Facilities Collection (`facilities`)
```javascript
{
  id: "facility_id",
  name: "FIRSTLINE - NTUNGAMO",
  code: "FLNT",
  address: "Plot 123, Main Street, Ntungamo",
  phone: "+256 700 123 456",
  email: "ntungamo@firstlinelabs.ug",
  licenseNumber: "UG-LAB-2024-FLNT",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Test Categories Collection (`test_categories`)
```javascript
{
  id: "category_id",
  name: "Hematology",
  description: "Blood-related tests",
  order: 1,
  isActive: true,
  createdAt: Timestamp
}
```

---

## 🛠️ Troubleshooting

### Users Can't Log In
- Verify user exists in Firebase Authentication
- Check user profile exists in Firestore `users` collection
- Ensure user `isActive` is set to `true`
- Verify correct email and password

### Test Import Fails
- Check CSV format matches exactly (comma-separated, no extra spaces)
- Verify category IDs exist in `test_categories` collection
- Ensure price is a valid number
- Check for special characters that might break CSV parsing

### Role Routing Not Working
- Clear browser cache and cookies
- Log out and log back in
- Verify user role is correctly set in Firestore
- Check browser console for errors

### Facility Code Conflicts
- Ensure each facility has a unique code
- Codes should be 2-4 uppercase characters
- Avoid using codes already in use

---

## 📝 Best Practices

### User Management
✅ Use strong passwords (minimum 8 characters recommended)
✅ Assign users to correct facility
✅ Deactivate rather than delete departed staff (preserves audit trail)
✅ Keep user contact information up to date

### Test Management
✅ Use clear, standardized test codes
✅ Set realistic turnaround times
✅ Review and update prices regularly
✅ Group tests by category for easier management

### Facility Management
✅ Use descriptive facility names
✅ Keep facility codes short and memorable
✅ Update contact information when staff changes
✅ Ensure all facilities have valid licenses

---

## 🎯 Quick Start Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Configure Firebase credentials in `.env.local`
- [ ] Run seed endpoint (`/api/seed-initial-data`)
- [ ] Log in as owner (owner@labsync.ug / password123)
- [ ] Add your actual facilities
- [ ] Import your test menu
- [ ] Create user accounts for your staff
- [ ] Share login credentials securely with staff
- [ ] Test the workflow with each role
- [ ] Set up your first patient

---

## 📞 Support

For technical support or questions:
- Check the `PROJECT_SUMMARY.md` for system architecture
- Review the `CONTRIBUTING.md` for development guidelines
- Check Firebase Console for data verification

---

**Version:** 1.0.0
**Last Updated:** 2025-10-25
**System:** LabSync - Multi-Facility Laboratory Management System
