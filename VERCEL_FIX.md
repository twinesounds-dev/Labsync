# 🔧 Vercel Deployment Fix - Step by Step Guide

## ✅ What Was Fixed

The 404 error occurred because Vercel was looking at the repository root, but the application was in the `labsync/` subdirectory. 

**Solution**: I've moved all application files to the root directory where Vercel expects them.

---

## 📋 What You Need to Do Now

### Step 1: Commit and Push Changes

Run these commands in your terminal:

```bash
# Go to your repository root
cd /workspace

# Add all changes
git add .

# Commit changes
git commit -m "Fix: Move LabSync app to root for Vercel deployment"

# Push to your branch
git push
```

### Step 2: Wait for Vercel to Redeploy

After pushing, Vercel will automatically:
1. Detect the new commit
2. Start a new build
3. Deploy the application

This usually takes 2-5 minutes. You'll see the deployment status in your PR.

### Step 3: Verify the Deployment

Once the deployment is complete:

1. Click the "Preview" link in the Vercel comment on your PR
2. You should see the **LabSync login page** (not a 404 error!)
3. The page should look like this:

```
┌──────────────────────────────┐
│        LabSync               │
│   Laboratory Management      │
│                              │
│    Email: [________]         │
│    Password: [________]      │
│    [    Sign In    ]         │
└──────────────────────────────┘
```

---

## 🔐 Step 4: Set Up Firebase & Database (Important!)

Before you can use the application, you need to set up the database:

### 4a. Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select the **labsync** project
3. Go to **Settings** → **Environment Variables**
4. Add these variables (they're already in your .env.local file):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCcltEEpSPQibzlCpq_nlH3bn45bAaBqNg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=labsync-3.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=labsync-3
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=labsync-3.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=584235572925
NEXT_PUBLIC_FIREBASE_APP_ID=1:584235572925:web:7a24bd88abafdb2983a1d4
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-Z7SHHYN4R6
NEXTAUTH_URL=https://your-vercel-app-url.vercel.app
NEXTAUTH_SECRET=labsync-secret-key-2025-change-in-production
NEXT_PUBLIC_APP_NAME=LabSync
NEXT_PUBLIC_SUPPORT_EMAIL=support@labsync.ug
```

**Important**: Update `NEXTAUTH_URL` with your actual Vercel URL!

5. Click **Save** for each variable

### 4b. Seed the Database

After setting environment variables, seed your database:

```bash
# Replace with your actual Vercel URL
curl -X POST https://your-app-name.vercel.app/api/seed
```

You should see:
```json
{
  "success": true,
  "message": "Database seeded successfully"
}
```

### 4c. Create User Accounts

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **labsync-3**
3. Go to **Authentication** → **Users**
4. Click **Add user** and create these accounts:

| Email | Password | Role |
|-------|----------|------|
| owner@labsync.ug | ChooseAPassword123! | Owner |
| reception.ntungamo@labsync.ug | ChooseAPassword123! | Receptionist |
| clerk.ntungamo@labsync.ug | ChooseAPassword123! | Clerk |
| labtech.ntungamo@labsync.ug | ChooseAPassword123! | Lab Tech |

5. **Important**: After creating each user in Authentication, create a corresponding document in Firestore:

   - Go to **Firestore Database**
   - Open the `users` collection
   - Click **Add document**
   - Use the **UID from Authentication** as the Document ID
   - Add these fields:

   ```
   Document ID: [Use UID from Authentication]
   
   Fields:
   - id: [same as Document ID]
   - email: "owner@labsync.ug"
   - firstName: "John"
   - lastName: "Mugisha"
   - role: "owner"
   - facilityId: [Copy an ID from the facilities collection]
   - phone: "+256 700 000 100"
   - isActive: true
   - createdAt: [Use server timestamp]
   - updatedAt: [Use server timestamp]
   ```

   Repeat for each user with appropriate roles:
   - `owner` for owner@labsync.ug
   - `receptionist` for reception.ntungamo@labsync.ug
   - `clerk` for clerk.ntungamo@labsync.ug
   - `lab_tech` for labtech.ntungamo@labsync.ug

---

## ✅ Step 5: Test the Application

1. Visit your Vercel deployment URL
2. Login with: `owner@labsync.ug` and the password you set
3. You should be redirected to the **Owner Dashboard**
4. Verify you can see:
   - Total Revenue
   - Total Patients
   - Pending Approvals
   - Facility Performance cards

---

## 🎯 What's Working Now

After following these steps, you'll have:

✅ **Working Deployment** - No more 404 errors  
✅ **Login System** - Firebase authentication  
✅ **Database** - Seeded with facilities and 50+ tests  
✅ **User Accounts** - All 4 roles ready to use  
✅ **Dashboards** - Role-specific interfaces  
✅ **Patient Management** - Register patients  
✅ **Test Management** - Select and process tests  
✅ **Payment Processing** - Handle payments  
✅ **PDF Reports** - Generate lab reports  

---

## 🐛 Troubleshooting

### Issue: Still seeing 404 after pushing

**Solution**: 
1. Check the Vercel deployment logs
2. Ensure the build completed successfully
3. Try clearing your browser cache
4. Wait a few minutes for CDN to update

### Issue: Can't login after deployment

**Solution**:
1. Make sure you created user accounts in Firebase
2. Verify environment variables are set in Vercel
3. Check that `NEXTAUTH_URL` matches your Vercel URL
4. Ensure you created user documents in Firestore (not just Authentication)

### Issue: Database is empty

**Solution**:
1. Run the seed endpoint: `curl -X POST https://your-app.vercel.app/api/seed`
2. Check Firestore console to verify facilities and tests were created
3. If seed fails, check Vercel function logs

### Issue: Firebase connection errors

**Solution**:
1. Verify all Firebase environment variables are set correctly
2. Check Firebase project status in console
3. Ensure Firestore and Authentication are enabled
4. Review security rules (see DEPLOYMENT.md)

---

## 📞 Need Help?

If you encounter any issues:

1. **Check the logs**: Vercel Dashboard → Project → Deployments → Click on deployment → View Function Logs
2. **Firebase Console**: Check for any quota or permission issues
3. **Browser Console**: Check for any JavaScript errors (F12 → Console tab)

---

## 🎉 Success Checklist

- [ ] Pushed changes to repository
- [ ] Vercel redeployed successfully
- [ ] Can see login page (not 404)
- [ ] Environment variables set in Vercel
- [ ] Database seeded
- [ ] User accounts created in Firebase Auth
- [ ] User documents created in Firestore
- [ ] Can login successfully
- [ ] Can access dashboard
- [ ] Can register a patient

Once all checked, your LabSync deployment is complete! 🚀

---

**Questions?** Reply to the PR and I'll help you troubleshoot!
