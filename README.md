# 🧪 LabSync - Comprehensive Multi-Facility Laboratory Management System

<div align="center">

**A robust, offline-friendly laboratory management system designed for medical laboratories in Uganda**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.0-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

[Demo](#) • [Documentation](#documentation) • [Deployment Guide](DEPLOYMENT.md) • [Contributing](CONTRIBUTING.md)

</div>

---

## 🎯 Overview

LabSync is a comprehensive laboratory management system that supports multiple facilities under one owner with complete patient management, test processing, and financial tracking capabilities. Designed specifically for the Ugandan healthcare context with offline-first architecture.

### Supported Facilities

1. **FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO**
2. **FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - MBARARA**
3. **PRIMECURE MEDICAL CENTRE**

---

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

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd labsync

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Update .env.local with your Firebase credentials
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Initialize Database

```bash
# Seed the database with facilities and tests
curl -X POST http://localhost:3000/api/seed
```

### Create User Accounts

1. Go to Firebase Console → Authentication
2. Create users with these emails:
   - `owner@labsync.ug` (role: owner)
   - `reception.ntungamo@labsync.ug` (role: receptionist)
   - `clerk.ntungamo@labsync.ug` (role: clerk)
   - `labtech.ntungamo@labsync.ug` (role: lab_tech)

3. Create corresponding user documents in Firestore (see DEPLOYMENT.md for details)

---

## 📁 Project Structure

```
.
├── app/                          # Next.js App Router
│   ├── api/seed/                 # Database seeding
│   ├── auth/login/               # Authentication
│   └── dashboard/                # Role-based dashboards
├── components/                   # React components
│   ├── layout/                   # Layouts
│   └── ui/                       # UI components
├── lib/                          # Core libraries
│   ├── firebase.ts               # Firebase config
│   ├── firestore.ts              # Database utilities
│   └── pdf-generator.ts          # PDF generation
├── types/                        # TypeScript types
├── utils/                        # Utilities
├── public/                       # Static assets
└── scripts/                      # Setup scripts
```

---

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Important**: After deployment:
1. Set environment variables in Vercel dashboard
2. Seed production database: `curl -X POST https://your-app.vercel.app/api/seed`
3. Create user accounts in Firebase Console

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **PDF Generation**: jsPDF, jsPDF-AutoTable
- **Deployment**: Vercel

---

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[Project Summary](PROJECT_SUMMARY.md)** - Complete project overview
- **[Contributing](CONTRIBUTING.md)** - Contribution guidelines

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Receptionist** | Patient registration, Payments, Report printing |
| **Clerk** | Sample reception, Test selection |
| **Lab Technician** | Result entry, Quality control |
| **Owner** | Multi-facility overview, Approvals, User management |

---

## 🧪 Test Catalog

### Categories (24+ tests)

- **Hematology**: FBC, Malaria Test, Blood Group, ESR, Reticulocyte Count
- **Biochemistry**: LFT, RFT, Glucose, Lipid Profile, HbA1c
- **Microbiology**: Culture & Sensitivity, TB GeneXpert, Stool/Urine Microscopy
- **Serology**: HIV, Hepatitis B/C, Syphilis, COVID-19
- **Hormones**: Thyroid Function, PSA, Beta HCG, Progesterone

---

## 🔐 Environment Variables

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# NextAuth
NEXTAUTH_URL=https://your-app-url.com
NEXTAUTH_SECRET=your-secret-key

# Application
NEXT_PUBLIC_APP_NAME=LabSync
NEXT_PUBLIC_SUPPORT_EMAIL=support@labsync.ug
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

## 📞 Support

- **Email**: support@labsync.ug
- **Documentation**: See docs above
- **Issues**: GitHub Issues

---

<div align="center">

**Made with ❤️ for Ugandan Healthcare**

🎉 **Production Ready** • 🇺🇬 **Uganda-Specific** • 📱 **Offline-First** • 🔒 **Secure**

</div>
