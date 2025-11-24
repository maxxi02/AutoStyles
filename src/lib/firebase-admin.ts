// lib/firebase-admin.ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

if (!getApps().length && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    adminDb = getFirestore();
    adminAuth = getAuth();
  } catch (error) {
    console.warn("Firebase Admin SDK initialization failed:", error);
  }
}

export { adminAuth, adminDb };

