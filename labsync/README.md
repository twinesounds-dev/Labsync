# 🧪 LabSync - Comprehensive Multi-Facility Laboratory Management System

<div align="center">

![LabSync Logo](https://via.placeholder.com/150x150/0066CC/FFFFFF?text=LabSync)

**A robust, offline-friendly laboratory management system designed for medical laboratories in Uganda**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.0-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Demo Credentials](#demo-credentials)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

LabSync is a comprehensive laboratory management system that supports multiple facilities under one owner with complete patient management, test processing, and financial tracking capabilities. Designed specifically for the Ugandan healthcare context with offline-first architecture.

### Supported Facilities

1. **FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO**
2. **FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - MBARARA**
3. **PRIMECURE MEDICAL CENTRE**

## ✨ Features

### 🏥 Patient Management
- ✅ Complete Uganda-specific patient registration
- ✅ National ID and NIN support
- ✅ District-based address system
- ✅ Insurance and corporate payment types
- ✅ External lab request form handling

### 🧪 Test Management
- ✅ Pre-configured test catalog (50+ tests)
- ✅ 5 major categories: Hematology, Biochemistry, Microbiology, Serology, Hormones
- ✅ Normal range validation (age/gender specific)
- ✅ Custom test configuration
- ✅ Turnaround time tracking

### 💰 Payment Processing
- ✅ Cash, mobile money, card, and insurance payments
- ✅ MTN and Airtel Mobile Money support
- ✅ Receipt generation and printing
- ✅ Partial payment tracking
- ✅ Discount management

### 📊 Role-Based Dashboards
- ✅ **Receptionist**: Patient registration, payments, report printing
- ✅ **Clerk**: Sample reception, test selection, request forms
- ✅ **Lab Technician**: Test processing, result entry, quality control
- ✅ **Owner/Admin**: Multi-facility overview, approvals, reporting

### 📄 Professional Reporting
- ✅ PDF lab reports with facility branding
- ✅ Professional receipt generation
- ✅ Normal range flagging (High/Low/Critical)
- ✅ Multi-test result consolidation

### 🔒 Security & Audit
- ✅ Firebase Authentication
- ✅ Role-based access control
- ✅ Audit trail logging
- ✅ Secure data handling

### 📱 Offline Capability
- ✅ Service worker implementation
- ✅ Local data caching
- ✅ Background sync
- ✅ Conflict resolution

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **PDF Generation**: jsPDF, jsPDF-AutoTable
- **Forms**: React Hook Form, Zod
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd labsync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Firebase configuration (already provided in the example).

4. **Set up Firebase**
   - Create a Firebase project
   - Enable Firestore Database
   - Enable Firebase Authentication (Email/Password)
   - Enable Firebase Storage
   - Update security rules (provided in the project)

5. **Initialize the database**
   
   Start the development server first:
   ```bash
   npm run dev
   ```
   
   Then seed the database with facilities and tests:
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

6. **Access the application**
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
labsync/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── seed/                 # Database seeding endpoint
│   ├── auth/                     # Authentication pages
│   │   ├── login/                # Login page
│   │   └── signup/               # Signup page
│   ├── dashboard/                # Role-based dashboards
│   │   ├── reception/            # Receptionist dashboard
│   │   ├── clerk/                # Clerk dashboard
│   │   ├── lab-tech/             # Lab Technician dashboard
│   │   └── owner/                # Owner dashboard
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (redirects)
├── components/                   # React components
│   ├── layout/                   # Layout components
│   │   └── DashboardLayout.tsx   # Main dashboard layout
│   ├── ui/                       # UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   └── Card.tsx
│   └── patients/                 # Patient components
├── lib/                          # Core libraries
│   ├── firebase.ts               # Firebase initialization
│   ├── firestore.ts              # Firestore utilities
│   ├── auth-context.tsx          # Authentication context
│   ├── constants.ts              # App constants
│   └── pdf-generator.ts          # PDF generation
├── types/                        # TypeScript types
│   └── index.ts                  # Type definitions
├── utils/                        # Utility functions
│   └── seed-data.ts              # Database seeding
├── public/                       # Static assets
├── .env.local.example            # Environment variables template
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

## 👥 User Roles

### Receptionist
- Patient registration and biodata collection
- Payment processing and receipt generation
- Printing test requests and final reports
- Patient queue management

### Clerk
- Sample reception and verification
- Test selection based on doctor's requests
- Adding clerk notes and observations
- Sample labeling and tracking

### Lab Technician
- Test processing and analysis
- Result entry with normal range validation
- Quality control documentation
- Result submission for approval

### Owner/Admin
- Final test result approval
- Multi-facility dashboard access
- Financial reporting and analytics
- User management and system configuration

## 🗄️ Database Schema

### Collections

- **facilities**: Laboratory facilities
- **users**: System users with roles
- **patients**: Patient records
- **test_categories**: Test categories (Hematology, etc.)
- **tests**: Individual tests
- **test_normal_ranges**: Normal value ranges
- **test_requests**: Test orders
- **test_results**: Test results
- **payments**: Payment records
- **audit_logs**: System audit trail

## 🌐 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set environment variables in Vercel**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.local`

5. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Firebase Configuration for Production

Update Firebase security rules before going to production:

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner() {
      return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
    
    match /facilities/{facilityId} {
      allow read: if isAuthenticated();
      allow write: if isOwner();
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner() || request.auth.uid == userId;
    }
    
    match /patients/{patientId} {
      allow read, write: if isAuthenticated();
    }
    
    // Add more granular rules for other collections
  }
}
```

## 🔐 Demo Credentials

For testing purposes, the following demo accounts are available after seeding:

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@labsync.ug | *Set via Firebase Console* |
| Receptionist (Ntungamo) | reception.ntungamo@labsync.ug | *Set via Firebase Console* |
| Clerk (Ntungamo) | clerk.ntungamo@labsync.ug | *Set via Firebase Console* |
| Lab Tech (Ntungamo) | labtech.ntungamo@labsync.ug | *Set via Firebase Console* |
| Receptionist (Mbarara) | reception.mbarara@labsync.ug | *Set via Firebase Console* |

**Note**: After seeding, you'll need to set passwords for these users in the Firebase Console under Authentication.

## 📝 Features Roadmap

- [x] Patient registration
- [x] Test management
- [x] Payment processing
- [x] Role-based dashboards
- [x] PDF report generation
- [x] Multi-facility support
- [ ] SMS notifications
- [ ] Email reports
- [ ] Advanced analytics
- [ ] Inventory management
- [ ] Equipment maintenance tracking
- [ ] Quality control module
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for Ugandan medical laboratories
- Designed with offline-first principles
- Tailored for resource-constrained environments

## 📞 Support

For support, email support@labsync.ug or create an issue in the repository.

---

<div align="center">

**Made with ❤️ for Ugandan Healthcare**

[Website](#) • [Documentation](#) • [Report Bug](#) • [Request Feature](#)

</div>
