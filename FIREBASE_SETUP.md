# 🔥 Firebase Domain Authorization Setup

## To fix the "auth/unauthorized-domain" error:

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Select your project: `wellness-project-738b0`

### Step 2: Add Authorized Domains
1. Go to **Authentication** in the left sidebar
2. Click on **Settings** tab
3. Scroll down to **Authorized domains**
4. Click **Add domain**
5. Add your Netlify domain (e.g., `your-app-name.netlify.app`)

### Step 3: Common Netlify Domains to Add
- `your-app-name.netlify.app`
- `localhost` (for local development)
- `127.0.0.1` (for local development)

### Step 4: Save Changes
- Click **Save** after adding the domains
- Wait a few minutes for changes to propagate

## Current Firebase Config
- **Project ID**: `wellness-project-738b0`
- **Auth Domain**: `wellness-project-738b0.firebaseapp.com`

## Authentication Method
- ✅ **Google Sign-in**: Enabled
- ❌ **Email/Password**: Disabled (commented out)

## After Setup
Your app will work with Google sign-in only. Users can sign in using their Google accounts.
