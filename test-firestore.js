import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (rawKey.startsWith("'") && rawKey.endsWith("'")) {
  rawKey = rawKey.slice(1, -1);
}
const serviceAccount = JSON.parse(rawKey);
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

const app = initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth(app);
const db = getFirestore(app);

async function check() {
  try {
    console.log("Checking Firestore...");
    await db.collection('users').limit(1).get();
    console.log("Firestore OK!");
  } catch (err) {
    console.error("Firestore ERROR:", err.message);
  }
}
check();
