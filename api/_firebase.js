const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

if (!admin.apps.length) {
  let credential;

  // 1. Try to read from environment variable (for Vercel production)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env variable');
    }
  } 
  // 2. Fall back to local file for development
  else {
    try {
      const localKeyPath = path.join(process.cwd(), 'malsadeep-wedding-invitation-firebase-adminsdk-fbsvc-c296fb1e7a.json');
      if (fs.existsSync(localKeyPath)) {
        const serviceAccount = require(localKeyPath);
        credential = admin.credential.cert(serviceAccount);
      }
    } catch (err) {
      console.error('Failed to load local Firebase credentials', err);
    }
  }

  if (!credential) {
    throw new Error('Firebase credentials not found. Please set FIREBASE_SERVICE_ACCOUNT env var or provide the local JSON key file.');
  }

  admin.initializeApp({
    credential: credential
  });
}

const db = admin.firestore();

module.exports = { db };
