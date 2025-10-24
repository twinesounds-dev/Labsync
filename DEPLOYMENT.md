# LabSync Deployment Guide

This guide will walk you through deploying LabSync to production using Vercel and Firebase.

## Prerequisites

- Firebase account
- Vercel account
- Git repository (GitHub, GitLab, or Bitbucket)
- Node.js 18+ installed locally

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or use existing project `labsync-3`
3. Enable Google Analytics (optional)

### 1.2 Enable Firebase Services

#### Firestore Database
1. Go to Firestore Database
2. Click "Create database"
3. Start in **production mode**
4. Choose a location (e.g., `us-central`)

#### Authentication
1. Go to Authentication
2. Click "Get started"
3. Enable **Email/Password** provider
4. (Optional) Enable other providers as needed

#### Storage
1. Go to Storage
2. Click "Get started"
3. Start in **production mode**
4. Use default security rules

### 1.3 Update Security Rules

#### Firestore Rules

Go to Firestore Database → Rules and update:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
    
    function isSameFacility(facilityId) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.facilityId == facilityId;
    }
    
    match /facilities/{facilityId} {
      allow read: if isAuthenticated();
      allow write: if isOwner();
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner();
      allow update: if isOwner() || request.auth.uid == userId;
      allow delete: if isOwner();
    }
    
    match /patients/{patientId} {
      allow read, write: if isAuthenticated() && 
        isSameFacility(resource.data.facilityId);
    }
    
    match /test_categories/{categoryId} {
      allow read: if isAuthenticated();
      allow write: if isOwner();
    }
    
    match /tests/{testId} {
      allow read: if isAuthenticated();
      allow write: if isOwner();
    }
    
    match /test_normal_ranges/{rangeId} {
      allow read: if isAuthenticated();
      allow write: if isOwner();
    }
    
    match /test_requests/{requestId} {
      allow read, write: if isAuthenticated() && 
        isSameFacility(resource.data.facilityId);
    }
    
    match /test_results/{resultId} {
      allow read: if isAuthenticated() && 
        isSameFacility(resource.data.facilityId);
      allow create, update: if isAuthenticated() && 
        isSameFacility(request.resource.data.facilityId);
      allow delete: if isOwner();
    }
    
    match /payments/{paymentId} {
      allow read, write: if isAuthenticated() && 
        isSameFacility(resource.data.facilityId);
    }
    
    match /audit_logs/{logId} {
      allow read: if isOwner();
      allow write: if isAuthenticated();
    }
  }
}
\`\`\`

#### Storage Rules

Go to Storage → Rules and update:

\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /patients/{patientId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /external_forms/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
\`\`\`

## Step 2: Seed the Database

### 2.1 Local Seeding

1. **Start the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Seed the database:**
   \`\`\`bash
   curl -X POST http://localhost:3000/api/seed
   \`\`\`

### 2.2 Create User Accounts

1. Go to Firebase Console → Authentication → Users
2. Click "Add user"
3. Create the following users:

| Email | UID (suggested) | Role |
|-------|----------------|------|
| owner@labsync.ug | demo-owner-1 | owner |
| reception.ntungamo@labsync.ug | demo-reception-ntungamo | receptionist |
| clerk.ntungamo@labsync.ug | demo-clerk-ntungamo | clerk |
| labtech.ntungamo@labsync.ug | demo-labtech-ntungamo | lab_tech |
| reception.mbarara@labsync.ug | demo-reception-mbarara | receptionist |

4. For each user, create a corresponding document in Firestore:
   - Collection: `users`
   - Document ID: Use the UID from above
   - Fields:
     \`\`\`json
     {
       "id": "<UID>",
       "email": "<email>",
       "firstName": "<first name>",
       "lastName": "<last name>",
       "role": "<role>",
       "facilityId": "<facility ID from facilities collection>",
       "phone": "+256 700 000 xxx",
       "isActive": true,
       "createdAt": <server timestamp>,
       "updatedAt": <server timestamp>
     }
     \`\`\`

## Step 3: Vercel Deployment

### 3.1 Push to Git

\`\`\`bash
git init
git add .
git commit -m "Initial commit - LabSync"
git remote add origin <your-repo-url>
git push -u origin main
\`\`\`

### 3.2 Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: **./labsync** (or ./ if in root)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3.3 Configure Environment Variables

In Vercel project settings, add the following environment variables:

\`\`\`env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCcltEEpSPQibzlCpq_nlH3bn45bAaBqNg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=labsync-3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=labsync-3
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=labsync-3.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=584235572925
NEXT_PUBLIC_FIREBASE_APP_ID=1:584235572925:web:7a24bd88abafdb2983a1d4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-Z7SHHYN4R6

NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-a-secret-key>

NEXT_PUBLIC_APP_NAME=LabSync
NEXT_PUBLIC_SUPPORT_EMAIL=support@labsync.ug
\`\`\`

**To generate a secure secret:**
\`\`\`bash
openssl rand -base64 32
\`\`\`

### 3.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Visit your deployment URL

### 3.5 Add Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `labsync.ug`)
3. Configure DNS records as instructed by Vercel

## Step 4: Post-Deployment

### 4.1 Seed Production Database

\`\`\`bash
curl -X POST https://your-app.vercel.app/api/seed
\`\`\`

### 4.2 Test All Roles

1. Login as each role
2. Verify dashboard access
3. Test key workflows:
   - Receptionist: Patient registration, payment
   - Clerk: Sample reception
   - Lab Tech: Result entry
   - Owner: Result approval

### 4.3 Monitor Performance

- Check Vercel Analytics
- Monitor Firebase Console for errors
- Review Firestore usage

## Step 5: Continuous Deployment

Any push to the `main` branch will automatically deploy to production.

For staging:
1. Create a `develop` branch
2. Vercel will create preview deployments for PRs
3. Merge to `main` for production deployment

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Review build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`

### Firebase Connection Issues
- Verify Firebase credentials
- Check Firebase project status
- Review security rules

### Authentication Problems
- Ensure Firebase Auth is enabled
- Check NEXTAUTH_URL matches deployment URL
- Verify NEXTAUTH_SECRET is set

## Support

For issues, contact: support@labsync.ug

## Production Checklist

- [ ] Firebase project created
- [ ] Firestore database initialized
- [ ] Authentication enabled
- [ ] Storage bucket created
- [ ] Security rules updated
- [ ] Database seeded
- [ ] User accounts created
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Custom domain added (optional)
- [ ] Production deployment successful
- [ ] All roles tested
- [ ] Monitoring enabled

---

**Congratulations!** Your LabSync deployment is complete! 🎉
