# Firestore Security Rules Setup Guide

## Overview
The `firestore.rules` file contains security rules for your Firestore database. You need to deploy these rules to Firebase to fix the "Missing or insufficient permissions" errors.

## Quick Setup (2 minutes)

### Option 1: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **autostyles-76646**
3. Go to **Firestore Database** → **Rules** tab
4. Copy all content from `firestore.rules` file
5. Paste it into the Firebase Console rules editor
6. Click **Publish**

### Option 2: Using Firebase CLI (Recommended)

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project directory:
   ```bash
   firebase init firestore
   ```
   - Select your project: **autostyles-76646**
   - Keep the default firestore.rules file path

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## What These Rules Do

### 1. **Login Attempts Collection** (`loginAttempts`)
```
✅ Public read/write (for brute-force protection tracking)
📝 Stores failed login attempts per email
```

### 2. **User Sessions Collection** (`userSessions`)
```
✅ Users can only access their own sessions
✅ Only authenticated users can access
📝 Tracks active device sessions per user
```

### 3. **Users Collection**
```
✅ Users can read/write their own data
✅ Admins can read/write all user data
```

### 4. **Public Collections** (carTypes, carModels, paintColors, wheels, interiors, pricingRules)
```
✅ Everyone can read
✅ Only admins can write
```

### 5. **Transactions & Appointments**
```
✅ Users can see their own transactions/appointments
✅ Admins can see all transactions/appointments
✅ Users can only create/update/delete their own
```

## Verification

After deploying the rules:

1. Refresh your browser
2. Try logging in again
3. The error should be gone!

If you still see errors:
- Check browser console (F12)
- The error message should be more specific
- Verify project ID is correct: **autostyles-76646**

## Rule Structure Explanation

```javascript
// Helper function to check if user is authenticated
function isAuthenticated() {
  return request.auth != null;
}

// Helper function to check if request belongs to the user
function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// Helper function to check if user is admin
function isAdmin() {
  return isAuthenticated() && 
         exists(/databases/{database}/documents/users/{request.auth.uid}) &&
         get(/databases/{database}/documents/users/{request.auth.uid}).data.role == 'admin';
}
```

## Collections Overview

| Collection | Read | Write | Notes |
|------------|------|-------|-------|
| `loginAttempts` | Public | Public | For brute-force protection |
| `userSessions` | Owner only | Owner only | Device session tracking |
| `users` | Owner + Admin | Owner + Admin | User profiles |
| `carTypes` | Public | Admin only | Car type catalog |
| `carModels` | Public | Admin only | Car model catalog |
| `paintColors` | Public | Admin only | Paint color options |
| `wheels` | Public | Admin only | Wheel options |
| `interiors` | Public | Admin only | Interior options |
| `pricingRules` | Public | Admin only | Discount rules |
| `transactions` | Owner + Admin | Owner + Admin | Payment transactions |
| `appointments` | Owner + Admin | Owner + Admin | Service appointments |

## Common Issues

### Issue: Still getting "permission-denied" error
**Solution:**
- Verify project ID is correct in Firebase config
- Wait 30 seconds for rules to propagate
- Refresh browser and clear cache (Ctrl+Shift+Delete)
- Check that user is authenticated before accessing restricted collections

### Issue: Cannot access Firestore in Firebase Console
**Solution:**
- Verify you have correct permissions in Firebase
- You should be a Project Owner or Editor

### Issue: Admin operations not working
**Solution:**
- Verify user has `role: 'admin'` in their user document
- Check document path: `/users/{userId}` where userId is their UID

## Testing Rules Locally

To test rules locally before deploying:

```bash
firebase emulators:start --only firestore
```

This starts a local Firestore emulator where you can test your rules.

## Rolling Back

If something goes wrong:

1. Go to Firebase Console → Firestore Rules
2. View **Version History**
3. Click the previous version to restore
4. Click **Restore this version**

## Additional Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/start)
- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Firebase Security Best Practices](https://firebase.google.com/docs/firestore/security/best-practices)

## Next Steps

1. ✅ Deploy the firestore.rules file using one of the methods above
2. ✅ Refresh your browser
3. ✅ Test logging in - should work without permission errors
4. ✅ If device session feature is enabled, it should now track sessions properly

---

**Need Help?**
If you encounter any issues:
1. Check browser console (F12) for detailed error messages
2. Look at Firebase Console → Firestore → Usage to see which operations are failing
3. Verify project ID and credentials in your `.env` file
