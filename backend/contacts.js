const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

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

function readSecret(secretName) {
  const client = new SecretManagerServiceClient();
  return client.accessSecretVersion({
    name: `projects/282482783617/secrets/${secretName}/versions/latest`,
  }).then(([version]) => version.payload.data.toString('utf8'));
}

// Initialize Firebase THEN start app
readSecret('my-service-account-key')
  .then(secretJson => {
    const serviceAccount = JSON.parse(secretJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase initialized');

    const db = admin.firestore();
    const contactsCollection = db.collection('contacts');
    const balanceDoc = db.collection('accounts').doc('main');

    app.get('/api/contacts', (req, res) => {
      contactsCollection.get()
        .then(snapshot => {
          if (snapshot.empty) {
            console.log('Seeding contacts...');
            return Promise.all(sampleContacts.map(c => contactsCollection.add(c)))
              .then(() => contactsCollection.get());
          }
          return snapshot;
        })
        .then(snapshot => {
          const contacts = snapshot.docs.map(doc => doc.data());
          res.json(contacts);
        })
        .catch(err => {
          console.error('Firestore error:', err);
          res.status(500).json({ error: 'Failed to fetch contacts', details: err.message });
        });
    });

    app.get('/api/balance', (req, res) => {
      balanceDoc.get()
        .then(doc => {
          if (!doc.exists) {
            return balanceDoc.set({ balance: 100000 }).then(() => ({ balance: 100000 }));
          }
          return { balance: doc.data().balance };
        })
        .then(balance => res.json(balance))
        .catch(err => {
          console.error('Firestore error (balance):', err);
          res.status(500).json({ error: 'Failed to fetch balance', details: err.message });
        });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Contacts API running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('🔥 Failed to initialize Firebase or start app:', err);
    process.exit(1);
  });
