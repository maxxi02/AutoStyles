# 🧪 Device Login Feature - Live Testing Guide

## Current Status
- ✅ Server running on: `http://localhost:3001`
- ✅ Login page loaded
- ✅ Ready for testing

## 📋 Pre-Testing Checklist

Before starting tests, verify:
- [ ] Firestore rules deployed (if not, device session will be skipped gracefully)
- [ ] Firebase credentials in `.env` file
- [ ] Browser DevTools available (F12)
- [ ] Incognito/Private window available

## 🧪 Test 1: Device ID Generation

### What to Test
Verify that device ID is generated and stored locally.

### Steps
1. Open browser console (F12)
2. Paste code:
   ```javascript
   console.log("Device ID:", localStorage.getItem('device_id'));
   ```
3. If nothing shows, it's because you haven't logged in yet (expected)

### Expected Result
- ✅ Before login: `null` or empty (expected)
- ✅ After login: UUID string like `550e8400-e29b-41d4-a716-446655440000`

---

## 🧪 Test 2: Login & Device Registration

### What to Test
Verify device session is registered when logging in.

### Steps
1. Open DevTools (F12) → Network tab
2. Refresh page to clear network history
3. Fill login form:
   - Email: `autostyles04@gmail.com` (or your test account)
   - Password: (your password)
4. Click "Login"
5. Watch Network tab for requests

### Expected Results
✅ **Should see these requests:**
- `POST /api/device-session` (Status: 200)
- Response body includes:
  ```json
  {
    "success": true,
    "message": "Device session registered successfully",
    "sessionId": "abc123..."
  }
  ```

✅ **After successful login:**
- Redirected to dashboard (`/a/dashboard`, `/w/dashboard`, or `/c/dashboard`)
- Browser console should have minimal errors
- No "permission-denied" errors

### 🔍 Verification in Console
```javascript
// Run in console after login:
console.log("Device ID:", localStorage.getItem('device_id'));
console.log("Auth Token exists:", !!document.cookie.match(/authToken=/));
console.log("Device ID Cookie:", !!document.cookie.match(/deviceId=/));
```

---

## 🧪 Test 3: Session Monitoring (Every 30 Seconds)

### What to Test
Verify SessionCheck component runs automatically.

### Steps
1. Login successfully (complete Test 2 first)
2. Open DevTools → Network tab
3. Filter by: `device-session`
4. Wait 30 seconds
5. Watch for automatic GET request

### Expected Results
✅ **Should see `GET /api/device-session`:**
- Appears automatically every 30 seconds
- Status: 200
- Response includes: `{ "success": true, "isValid": true }`
- No user interaction needed

✅ **In console:**
```javascript
// Check when request happened
console.log("Last device session check:", new Date().toLocaleTimeString());
```

---

## 🧪 Test 4: Multi-Device Detection (Incognito Window)

### What to Test
Verify that logging in from another device logs out the first device.

### Steps (MOST IMPORTANT TEST)

**Part A: Login on Main Window**
1. In main browser window: Already logged in from Test 2 ✅
2. Keep this window open
3. Open DevTools on this window (leave it open)

**Part B: Login from Incognito Window**
1. Open NEW Incognito/Private window
2. Go to: `http://localhost:3001/login`
3. Login with **SAME CREDENTIALS** as first window
4. Watch Network tab

**Part C: Observe First Window**
1. Go back to first window (main browser)
2. Watch for notification toast: "You were logged out because you logged in from another device"
3. Should be redirected to login page

### Expected Results
✅ **Incognito Window:**
- Login succeeds ✅
- Dashboard loads normally

✅ **First Window:**
- Within 30 seconds: Toast notification appears
- Message: "You were logged out because you logged in from another device"
- Redirects to login page
- Cannot access dashboard anymore

✅ **Console on First Window:**
```javascript
// Before device switch:
localStorage.getItem('device_id'); // abc123...

// After device switch (30 sec later):
// Should still exist but session marked inactive in Firestore
```

✅ **Firestore Verification:**
- Go to Firebase Console → Firestore Database → Data
- Collection: `userSessions`
- Your user ID document
- Should show 2 device sessions:
  - Device 1: `isActive: false` (logged out)
  - Device 2: `isActive: true` (currently active)

---

## 🧪 Test 5: Logout Functionality

### What to Test
Verify proper logout and device session cleanup.

### Steps
1. Make sure you're logged in
2. Find logout button (usually in user menu)
3. Click "Log Out"
4. Confirm logout dialog

### Expected Results
✅ **Should see:**
- DELETE request to `/api/device-session` (Status: 200)
- Redirect to login page
- Device ID cookie cleared

✅ **Console verification:**
```javascript
// After logout:
console.log("Device ID Cookie:", document.cookie.match(/deviceId=/)); // null
console.log("Auth Token:", document.cookie.match(/authToken=/)); // null
```

---

## 📊 Test Results Summary

Create a table to track results:

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| Device ID generated | UUID string | ? | ⏳ |
| Device registration | POST 200 | ? | ⏳ |
| Session monitoring | GET every 30s | ? | ⏳ |
| Multi-device logout | Auto logout | ? | ⏳ |
| Firestore storage | Session tracked | ? | ⏳ |
| Logout cleanup | Cleared | ? | ⏳ |

---

## 🔧 Troubleshooting Tests

### Issue: Device session registration fails (POST returns 500)

**Possible causes:**
1. Firebase Admin SDK not initialized
   - Check: `.env` has `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
   - Expected behavior: Gracefully skipped (not a blocker)

2. Firestore rules not deployed
   - Check: Firebase Console → Firestore Rules
   - Solution: Deploy `firestore.rules` file

**What to do:**
- Check browser console for error details
- Open Network tab → click POST request → see Response tab
- Look for error message

### Issue: GET requests not appearing every 30 seconds

**Possible causes:**
1. SessionCheck component not mounted
   - Check: Root layout has `<SessionCheck />` component
   - Should be in `src/app/layout.tsx`

2. No currentUser in Firebase Auth
   - Need to be logged in for SessionCheck to run
   - Expected: Only runs after successful login

**What to do:**
- Verify you're logged in
- Wait exactly 30 seconds (might be on 30-second cycle)
- Refresh page and wait

### Issue: Incognito window not logging out first window

**Possible causes:**
1. Firestore rules not deployed
   - Device sessions not being read properly
   - Solution: Deploy `firestore.rules`

2. SessionCheck not running
   - First window needs to be checking regularly
   - Solution: Keep first window open, check Network tab

3. Different user accounts
   - Make sure both windows logged in with SAME credentials
   - Different accounts = different userSessions document

**What to do:**
- Check Firestore: Is `userSessions` collection created?
- Check Rules: Is `userSessions` collection allowed?
- Verify: Same email/account in both windows

---

## 📈 Performance Checklist

After all tests pass:

| Item | Expected | Actual |
|------|----------|--------|
| Login time | < 2 sec | ? |
| Device registration | < 500ms | ? |
| SessionCheck API call | < 200ms | ? |
| Memory usage stable | No leaks | ? |
| No console errors | Clean console | ? |

---

## ✅ Final Verification

After all tests are complete:

```javascript
// Run this in console to confirm everything works:
console.table({
  "Device ID Present": !!localStorage.getItem('device_id'),
  "Auth Token": !!document.cookie.match(/authToken=/),
  "User Role": document.cookie.match(/userRole=([^;]*)/)?.[1] || 'N/A',
  "Device ID": localStorage.getItem('device_id')?.substring(0, 8) + '...',
  "Is Authenticated": !!localStorage.getItem('device_id')
});
```

---

## 📝 Notes

- **Note 1:** If Firebase Admin SDK is not configured, device session will silently skip (this is OK)
- **Note 2:** Permission errors might still show in console (these are expected and handled)
- **Note 3:** SessionCheck might not run immediately - wait 2 seconds after login
- **Note 4:** Firestore data takes a few seconds to propagate

---

## 🎯 Success Criteria

✅ **PASS if:**
- Device ID is generated and persisted
- Device registration POST succeeds
- SessionCheck runs every 30 seconds
- Logging in from another device logs out first device
- Logout clears device session
- No critical console errors

❌ **FAIL if:**
- Device session registration returns error (not graceful skip)
- SessionCheck doesn't run at all
- Multi-device logout doesn't work (and Firestore rules are deployed)
- Logout doesn't cleanup
- Permission-denied errors block login

---

## 🚀 Next Steps

1. ✅ Run Test 1-2 (Basic functionality)
2. ✅ Run Test 3 (Session monitoring)
3. ✅ Run Test 4 (Multi-device detection) - MOST IMPORTANT
4. ✅ Run Test 5 (Logout)
5. ✅ Document results
6. ✅ Report any issues

**Ready to test?** Start with Test 2 (Login & Device Registration) 🧪
