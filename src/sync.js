// syncAuthToUsers.js
// Script to pull all users from Firebase Auth and add them to Firestore 'users' collection

const admin = require('firebase-admin');
const serviceAccount = require('./attendance-f524b-firebase-adminsdk-fbsvc-77762c47e6.json');

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncUsers() {
  let nextPageToken;
  do {
    // List up to 1000 users at a time from Auth
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);

    const writeOps = listUsersResult.users.map((userRecord) => {
      const email = userRecord.email || '';
      const username = email.split('@')[0];

      // Prepare default user doc data
      const userData = {
        email,
        absences: 0,
        attendance: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Write to Firestore, merging with existing data if doc exists
      return db.collection('users').doc(username).set(userData, { merge: true })
        .then(() => console.log(`Synced: ${username}`));
    });

    // Await all writes for this batch
    await Promise.all(writeOps);

    // Prepare next batch
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log('✅ All Auth users synced to Firestore.');
}

syncUsers().catch((error) => {
  console.error('Error syncing users:', error);
  process.exit(1);
});
