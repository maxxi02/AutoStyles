# Device Session Login - Troubleshooting Guide

## Error: "Failed to register device session"

### Root Causes

This error typically occurs due to one of the following issues:

#### 1. **Firebase Admin SDK Not Initialized** (Most Common)
**Symptoms:** 
- Error occurs during login
- Console shows "Firebase Admin SDK not initialized"

**Causes:**
- Missing Firebase Admin credentials in environment variables
- Invalid Firebase service account credentials
- Environment variables not loaded

**Solution:**
```
Required environment variables in .env:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
```

Check your `.env` or `.env.local` file has these variables set correctly. The Firebase Admin SDK will automatically skip device session registration if not configured, and login will still work.

#### 2. **Firestore Permissions Issue**
**Symptoms:**
- Error status: 500 with "permission-denied" in error details
- Can verify token but cannot write to userSessions collection

**Solution:**
Add these rules to your Firestore security rules:

```javascript
match /userSessions/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

#### 3. **Token Verification Failed**
**Symptoms:**
- Error status: 401
- Console: "Invalid token" in error response

**Solution:**
- Check that the Firebase token is valid
- Verify Firebase credentials are correctly set
- Check that the token hasn't expired

#### 4. **Missing Required Fields**
**Symptoms:**
- Error status: 400
- Console: "Missing required fields"

**Solution:**
The login form should automatically generate:
- `deviceId` - Unique identifier (stored in localStorage)
- `fingerprint` - Browser fingerprint
- `userAgent` - Browser user agent string
- `token` - Firebase ID token

If any are missing, check browser console for JavaScript errors.

## How to Debug

### 1. Check Browser Console
Open Developer Tools (F12) and look for console errors:
- "Error registering device session" - Check error details
- "localStorage not available" - Indicates browser security issue

### 2. Check Network Tab
1. Go to Network tab in DevTools
2. Look for `POST /api/device-session` request
3. Click on it and check:
   - **Request Headers**: Verify Content-Type is `application/json`
   - **Request Body**: Should contain `token`, `deviceId`, `fingerprint`, `userAgent`
   - **Response Status**: 
     - 200 = Success
     - 400 = Missing fields
     - 401 = Token invalid
     - 500 = Server error
   - **Response Body**: Read error message for details

### 3. Check Server Logs
If running Next.js locally with `npm run dev`, check terminal for errors:
```
Error registering device session: [detailed error message]
```

### 4. Verify Firebase Admin SDK
Add this to check if Firebase Admin is initialized:
```typescript
import { adminAuth, adminDb } from "@/lib/firebase-admin";

console.log("Firebase Admin initialized:", {
  auth: !!adminAuth,
  db: !!adminDb
});
```

## Common Fixes

### Fix 1: Device Session Registration Not Critical
The device session feature is **gracefully degraded**. If it fails:
- ✅ User can still log in
- ✅ User can access dashboard
- ⚠️ Device session tracking won't work
- ⚠️ Multiple device login prevention won't work

### Fix 2: Environment Variables
Ensure your `.env.local` has Firebase Admin credentials:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

⚠️ Important: The private key must have literal `\n` characters for newlines when stored as a string.

### Fix 3: Firestore Collection Permissions
Go to Firebase Console → Firestore Database → Rules and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User Sessions - for device login tracking
    match /userSessions/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Your other existing rules...
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Fix 4: Clear Browser Data
Sometimes localStorage issues can cause problems:
1. Open DevTools → Application
2. Clear "Local Storage"
3. Refresh page
4. Try logging in again

A new device ID will be generated.

## Is Device Session Critical?

**NO** - The device session feature is optional:

### Without Device Session (Firebase Admin not configured):
- ✅ Users can still log in normally
- ✅ Users can access all dashboards
- ✅ All existing features work
- ❌ Multiple device login prevention doesn't work

### With Device Session (Firebase Admin configured):
- ✅ All above features
- ✅ Only one device per user at a time
- ✅ Automatic logout when logging in from another device
- ✅ Session tracking in Firestore

## Testing Without Device Session

If you don't want to set up Firebase Admin yet, comment out the device session registration:

In `src/forms/login-form.tsx`, comment out or remove:
```typescript
// Register device session on the server
// try { ... } catch { ... }
```

The login will work normally without device session tracking.

## Need More Help?

Check the following:
1. **Server Console**: Run `npm run dev` and watch terminal for error logs
2. **Browser Console**: Press F12 and check for JavaScript errors
3. **Network Tab**: Check `/api/device-session` POST request details
4. **Firebase Console**: Verify project ID and credentials
5. **Firestore Rules**: Ensure `userSessions` collection has write permissions

## Summary

| Issue | Status | Impact | Solution |
|-------|--------|--------|----------|
| Firebase Admin not configured | ⚠️ Warning | Device session skipped | Add env vars or disable feature |
| Firestore permissions denied | ❌ Error | Can't write sessions | Update Firestore rules |
| Token verification failed | ❌ Error | Can't verify user | Check Firebase config |
| localStorage unavailable | ❌ Error | Can't store device ID | Use normal browser mode |

The system is designed to work gracefully even when device session feature fails, ensuring users can always log in.
