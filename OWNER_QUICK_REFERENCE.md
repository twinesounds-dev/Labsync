# 🚀 Owner Quick Reference Card

## 📞 Login Credentials (Demo)
```
Email: owner@labsync.ug
Password: password123
```

## 🎯 Quick Actions from Dashboard

### 1️⃣ Add New User
**Path:** Dashboard → Manage Users → Add New User

**Quick Steps:**
1. Click "Manage Users" card
2. Click "Add New User" button
3. Fill in:
   - Name (First & Last)
   - Email (their login email)
   - Password (min 6 chars)
   - Phone (+256 format)
   - Role (Receptionist/Clerk/Lab Tech/Owner)
   - Facility (select from list)
4. Click "Create User"
5. **SAVE THE CREDENTIALS** shown in popup
6. Share securely with new user

**Result:** User can immediately log in and access their role-specific dashboard

---

### 2️⃣ Add New Test
**Path:** Dashboard → Manage Tests → Add New Test

**Quick Steps:**
1. Click "Manage Tests" in Management Tools
2. Click "Add New Test" button
3. Fill in:
   - Test Code (e.g., MAL)
   - Test Name (e.g., Malaria Test)
   - Category (select from dropdown)
   - Price in UGX (e.g., 15000)
   - Turnaround Time (e.g., "2 hours")
   - Sample Type (Blood/Urine/etc.)
   - Container Type (optional)
   - Storage Requirements (optional)
4. Click "Add Test"

**Result:** Test immediately available for selection system-wide

---

### 3️⃣ Import Multiple Tests
**Path:** Dashboard → Manage Tests → Import Tests

**Quick Steps:**
1. Click "Manage Tests"
2. Click "Import Tests" button
3. Prepare CSV in this format:
```csv
code,name,categoryId,price,turnaroundTime,sampleType,containerType,storageRequirements
MAL,Malaria Test,cat_id,15000,2 hours,Blood,EDTA tube,Room temp
HIV,HIV Test,cat_id,25000,1 hour,Blood,EDTA tube,2-8°C
```
4. Paste CSV data
5. Click "Import Tests"

**Result:** All tests added to database immediately

---

### 4️⃣ Add New Facility
**Path:** Dashboard → Facilities → Add New Facility

**Quick Steps:**
1. Click "Facilities" card
2. Click "Add New Facility" button
3. Fill in:
   - Facility Name (e.g., "FIRSTLINE - KAMPALA")
   - Facility Code (2-4 chars, e.g., "FLKA")
   - Address (full address)
   - Phone (+256 format)
   - Email
   - License Number
4. Click "Add Facility"

**Result:** New facility available for user assignment

---

### 5️⃣ Edit Facility Info
**Path:** Dashboard → Facilities → Edit (pencil icon)

**Quick Steps:**
1. Click "Facilities" card
2. Click edit icon on facility card
3. Modify any field
4. Click "Update Facility"

**Result:** Facility info updated immediately

---

## 🔐 User Roles & Access

| Role | Can Add Users | Can Manage Tests | Can Manage Facilities |
|------|--------------|------------------|---------------------|
| Owner | ✅ Yes | ✅ Yes | ✅ Yes |
| Receptionist | ❌ No | ❌ No | ❌ No |
| Clerk | ❌ No | ❌ No | ❌ No |
| Lab Tech | ❌ No | ❌ No | ❌ No |

**Note:** Only Owner has access to management features

---

## 🔍 Search Functions

All management pages have search:
- **Users:** Search by name, email, or role
- **Tests:** Search by name, code, or sample type
- **Facilities:** Search by name, code, or address

---

## ⚠️ Important Notes

### User Creation
- ✅ Save login credentials immediately
- ✅ Share credentials securely (WhatsApp, Email)
- ✅ User can login right away
- ✅ User automatically routed to their dashboard

### Test Management
- ✅ Tests appear immediately system-wide
- ✅ Deactivate (don't delete) old tests
- ✅ Price in UGX only
- ✅ Use clear test codes (MAL, HIV, LFT, etc.)

### Facility Management
- ✅ Facility code used in patient IDs
- ✅ Keep codes short (2-4 characters)
- ✅ Codes must be unique
- ✅ Edit instead of creating duplicates

---

## 🆘 Troubleshooting

### "User Already Exists"
- Email is already registered
- Use different email or deactivate old account

### "Category Not Found"
- Run seed endpoint: `/api/seed-initial-data`
- Or contact administrator

### "Permission Denied"
- Verify you're logged in as Owner
- Other roles can't access management features

### CSV Import Fails
- Check format exactly matches example
- Use comma separators (no spaces)
- Get category IDs from Firestore console

---

## 📱 Mobile-Friendly
All management pages work on mobile devices:
- Responsive design
- Touch-friendly buttons
- Scrollable tables

---

## 🎯 Common Workflows

### Onboarding New Staff
1. Add facility (if new location)
2. Create user account
3. Share credentials
4. User logs in and starts working

### Adding New Lab Test
1. Option A: Single test → Use "Add New Test"
2. Option B: Multiple tests → Use "Import Tests"
3. Test immediately available to all facilities

### Opening New Branch
1. Add new facility with unique code
2. Create user accounts for staff
3. Configure test menu (if different pricing)
4. Start operations

---

## 📊 Dashboard Overview

**Total Revenue** - Combined across all facilities
**Total Patients** - System-wide patient count
**Pending Approvals** - Results waiting for your approval

**Facility Performance** - Individual stats per location:
- Patient count
- Revenue
- Pending approvals
- Growth percentage

---

## 💡 Best Practices

### User Management
✅ Use staff email addresses
✅ Create strong passwords
✅ Assign correct roles
✅ Deactivate, don't delete

### Test Management
✅ Standardize test codes
✅ Update prices regularly
✅ Keep turnaround times realistic
✅ Use descriptive test names

### Facility Management
✅ Keep contact info current
✅ Use recognizable facility codes
✅ Update licenses on renewal
✅ Verify addresses are complete

---

## 🔄 Quick Navigation

From Owner Dashboard:
```
Manage Users       → /dashboard/owner/users
Manage Tests       → /dashboard/owner/tests
Facilities         → /dashboard/owner/facilities
Approve Results    → (Coming soon)
Financial Reports  → (Coming soon)
```

---

## 📞 Need Help?

1. Check `SETUP_GUIDE.md` for detailed instructions
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Contact system administrator
4. Check Firebase Console for data verification

---

**Last Updated:** 2025-10-25
**System Version:** 1.0.0
**Role:** Owner/Administrator
