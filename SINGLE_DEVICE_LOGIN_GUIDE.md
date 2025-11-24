# Single Device Login Implementation Guide

## Overview
This implementation ensures that only **one user per device** can be logged in at a time. If a user logs in from a different browser or device, any other active sessions will be automatically invalidated, forcing the user to log out.

## Components & Files Modified/Created

### 1. **Device Session Utility** (`src/lib/device-session.ts`)
Handles device identification and fingerprinting:
- **`getOrCreateDeviceId()`**: Generates a unique device ID (stored in localStorage)
- **`getDeviceFingerprint()`**: Creates a browser/OS fingerprint for additional verification
- **`getDeviceInfo()`**: Returns complete device information
- **`clearDeviceId()`**: Clears device ID on logout

### 2. **Device Session API** (`src/app/api/device-session/route.ts`)
Manages device sessions on the server:

#### **POST /api/device-session/register**
- Registers a new device session for the user
- Automatically invalidates all other active sessions
- Stores session data in Firestore under `userSessions` collection

**Request:**
```json
{
  "token": "firebase_id_token",
  "deviceId": "unique_device_id",
  "fingerprint": "base64_encoded_fingerprint",
  "userAgent": "browser_user_agent"
}
```

#### **GET /api/device-session/verify**
- Verifies if current device session is still active
- Updates last activity time
- Called periodically by the SessionCheck component

**Headers:**
```
Authorization: Bearer {token}
x-device-id: {deviceId}
```

#### **DELETE /api/device-session/logout**
- Marks device session as inactive
- Called when user logs out

**Request:**
```json
{
  "token": "firebase_id_token",
  "deviceId": "unique_device_id"
}
```

### 3. **Session Check Component** (`src/components/session-check.tsx`)
- **Client-side periodic checker** that runs in the background
- Checks every 30 seconds if the session is still valid
- Automatically redirects to login if session is invalidated
- Shows toast notification to user

### 4. **Updated Login Form** (`src/forms/login-form.tsx`)
**Changes:**
- Imports device session utilities
- On successful login:
  - Generates/retrieves device ID
  - Gets device fingerprint
  - Calls POST `/api/device-session` to register device
  - Stores device ID in cookie for future verification

### 5. **Updated Middleware** (`src/app/middleware.ts`)
**Changes:**
- Retrieves both token and device ID from cookies
- Calls GET `/api/device-session` to verify device session
- If session is invalidated, redirects to login with appropriate message
- Protects all dashboard routes (`/a/*`, `/w/*`, `/c/*`)

### 6. **Updated Root Layout** (`src/app/layout.tsx`)
- Adds `<SessionCheck />` component to monitor sessions globally

### 7. **Updated Logout Handler** (`src/components/nav-user.tsx`)
**Changes:**
- Calls DELETE `/api/device-session` to invalidate session before logout
- Clears device ID cookie
- Then proceeds with Firebase sign out

## Firestore Database Structure

### Collection: `userSessions`
```
userSessions/
  {userId}/
    {deviceId}: {
      uid: "user_id",
      deviceId: "unique_device_id",
      fingerprint: "base64_fingerprint",
      userAgent: "browser_info",
      loginTime: 1234567890,
      lastActivityTime: 1234567890,
      isActive: true,
      logoutTime: null
    }
```

## How It Works - Flow Diagram

### Login Flow
```
User logs in (Device A)
  ↓
Login form captures credentials
  ↓
Firebase authentication succeeds
  ↓
Generate/retrieve device ID
  ↓
POST /api/device-session/register
  ↓
Server invalidates all other sessions for this user
  ↓
Store deviceId in cookie
  ↓
Redirect to dashboard
```

### Session Validation Flow
```
User navigates to protected route (Device A)
  ↓
Middleware checks for token + deviceId
  ↓
Middleware calls GET /api/device-session
  ↓
Server verifies session is active
  ↓
If active: Allow access, update lastActivityTime
  ↓
If inactive: Redirect to login with message
```

### New Login From Another Device Flow
```
User logs in from Device B
  ↓
Server registers Device B session
  ↓
Server marks Device A session as inactive
  ↓
SessionCheck component (running on Device A) detects invalidation
  ↓
User is shown logout notification
  ↓
User is redirected to login page
```

### Logout Flow
```
User clicks "Log Out" (Device A)
  ↓
DELETE /api/device-session (mark session as inactive)
  ↓
Firebase signOut()
  ↓
Clear device ID cookie
  ↓
Redirect to login page
```

## Key Features

✅ **Automatic Session Invalidation**: When logging in from a new device, all other sessions are automatically marked as inactive

✅ **Real-time Detection**: SessionCheck component detects invalidation within 30 seconds and notifies the user

✅ **Device Fingerprinting**: Combines device ID + browser fingerprint for enhanced security

✅ **Persistent Device ID**: Device ID is stored in localStorage, persists across browser restarts

✅ **Activity Tracking**: Tracks last activity time for each session

✅ **Graceful Logout**: Sessions are properly marked as inactive when user logs out

✅ **Multi-Role Support**: Works with Admin (a/), AutoWorker (w/), and Client (c/) dashboards

## Configuration

### Session Check Interval
Default: 30 seconds (in `SessionCheck` component)

To modify, update the `checkInterval` prop in `src/app/layout.tsx`:
```tsx
<SessionCheck checkInterval={60000} /> // 60 seconds
```

### Firestore Permissions
Ensure your Firestore rules allow users to read/write to their own sessions:
```
match /userSessions/{userId} {
  allow read, write: if request.auth.uid == userId;
}
```

## Testing

### Test Scenario 1: Single Device Login
1. Log in on Browser A
2. Navigate to dashboard - should work ✓
3. Manually clear localStorage deviceId
4. Refresh page - should redirect to login ✓

### Test Scenario 2: Multi-Device Logout
1. Log in on Browser A → Redirects to dashboard
2. Open new private/incognito window (Browser B) with same credentials
3. Log in on Browser B
4. Return to Browser A - should show "logged out from another device" notification within 30 seconds
5. Middleware redirects Browser A to login page ✓

### Test Scenario 3: Manual Logout
1. Log in on Browser A
2. Click "Log Out"
3. Device session is marked as inactive
4. Redirected to login page ✓

## Security Considerations

⚠️ **Device ID Storage**: Device ID is stored in localStorage. While this works well for most use cases, consider these factors:
- localStorage is browser-specific (not shared across private/incognito windows)
- Clearing browser data will generate a new device ID
- Each tab in the same browser shares the same device ID

⚠️ **Token Security**: Always use HTTPS in production to prevent token interception

⚠️ **Fingerprint Spoofing**: Device fingerprint can be spoofed with browser extensions. Device ID is the primary identifier.

## Troubleshooting

### Issue: User not logging out when logging in from another device
**Solution**: Check that SessionCheck component is mounted (should be in root layout)

### Issue: Session persists after browser restart
**Solution**: This is intentional - device ID is persistent. Clear localStorage to reset.

### Issue: Different browser tabs logging out user
**Solution**: This is expected behavior if using private/incognito mode (different storage context). Use normal mode for multiple tabs.

### Issue: API returns 401 for device session
**Solution**: 
- Verify Firebase token is valid
- Check deviceId is being sent in headers
- Ensure Firestore has userSessions collection

## Future Enhancements

- Add UI to view active sessions and manually revoke them
- Implement "Remember this device" option for passwordless login
- Add device names/labels (e.g., "iPhone Safari", "Desktop Chrome")
- Push notifications when logged in from a new device
- Device trust levels (trusted/untrusted)
