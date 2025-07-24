const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');
const app = express();
const PORT = 8080;

app.use(cors());

// Firestore setup
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Storage } = require('@google-cloud/storage');

const serviceAccountPath = require('./secrets/serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Missing serviceAccountKey.json. Download it from Firebase Console and place it in backend/.');
  process.exit(1);
}
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});
const db = admin.firestore();
const contactsCollection = db.collection('contacts');
const balanceDoc = db.collection('accounts').doc('main');

const sampleContacts = [
  { name: 'Amit Sharma', photo: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { name: 'Priya Singh', photo: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { name: 'Rahul Verma', photo: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { name: 'Sneha Patel', photo: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { name: 'Vikram Joshi', photo: 'https://randomuser.me/api/portraits/men/5.jpg' },
  { name: 'Anjali Mehra', photo: 'https://randomuser.me/api/portraits/women/6.jpg' },
  { name: 'Rohit Gupta', photo: 'https://randomuser.me/api/portraits/men/7.jpg' },
  { name: 'Kavita Rao', photo: 'https://randomuser.me/api/portraits/women/8.jpg' },
  { name: 'Suresh Kumar', photo: 'https://randomuser.me/api/portraits/men/9.jpg' },
  { name: 'Neha Desai', photo: 'https://randomuser.me/api/portraits/women/10.jpg' }
];

app.get('/api/contacts', async (req, res) => {
  try {
    const snapshot = await contactsCollection.get();
    console.log('Firestore snapshot size:', snapshot.size);
    if (snapshot.empty) {
      // Seed Firestore if empty
      console.log('Seeding Firestore with sample contacts...');
      await Promise.all(sampleContacts.map(contact => contactsCollection.add(contact)));
      // Fetch again after seeding
      const seededSnapshot = await contactsCollection.get();
      const seededContacts = seededSnapshot.docs.map(doc => doc.data());
      return res.json(seededContacts);
    }
    const contacts = snapshot.docs.map(doc => doc.data());
    res.json(contacts);
  } catch (err) {
    console.error('Firestore error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts', details: err.message });
  }
});

app.get('/api/balance', async (req, res) => {
  try {
    const doc = await balanceDoc.get();
    if (!doc.exists) {
      // Seed balance if not present
      await balanceDoc.set({ balance: 100000 });
      return res.json({ balance: 100000 });
    }
    res.json({ balance: doc.data().balance });
  } catch (err) {
    console.error('Firestore error (balance):', err);
    res.status(500).json({ error: 'Failed to fetch balance', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Contacts API running on http://localhost:${PORT}`);
});

// Instructions:
// 1. Go to Firebase Console > Project Settings > Service Accounts.
// 2. Generate a new private key and download serviceAccountKey.json.
// 3. Place it in the backend/ directory. 