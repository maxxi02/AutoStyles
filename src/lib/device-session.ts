/**
 * Generates a unique device ID for the current browser/device
 * Stores it in localStorage for persistent identification across sessions
 */
export function getOrCreateDeviceId(): string {
  const DEVICE_ID_KEY = 'device_id';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Generate a simple UUID v4-like string without external dependency
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Generates a device fingerprint (browser + OS info for additional verification)
 */
export function getDeviceFingerprint(): string {
  const navigator_obj = navigator;
  const screen_obj = screen;
  
  const fingerprint = [
    navigator_obj.userAgent,
    navigator_obj.language,
    `${screen_obj.width}x${screen_obj.height}`,
    new Date().getTimezoneOffset(),
  ].join('|');
  
  return btoa(fingerprint); // Base64 encode for safe storage
}

/**
 * Gets device information for logging/display
 */
export function getDeviceInfo(): {
  deviceId: string;
  fingerprint: string;
  userAgent: string;
  timestamp: number;
} {
  return {
    deviceId: getOrCreateDeviceId(),
    fingerprint: getDeviceFingerprint(),
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  };
}

/**
 * Clears device ID from localStorage (for logout)
 */
export function clearDeviceId(): void {
  localStorage.removeItem('device_id');
}
