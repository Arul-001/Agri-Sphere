import { adminAuth, adminDb } from './src/lib/server/firebase-admin.js';

async function test() {
  try {
    console.log("Testing Firebase Admin Database connection...");
    const snapshot = await adminDb.collection('users').limit(1).get();
    console.log("Database connection successful. Docs:", snapshot.size);

    console.log("Firebase Admin successfully initialized and working.");
    process.exit(0);
  } catch (err) {
    console.error("Firebase Admin Error:", err);
    process.exit(1);
  }
}

test();
