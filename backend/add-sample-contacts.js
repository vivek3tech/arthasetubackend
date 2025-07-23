const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const contacts = [
  { name: 'Amit Sharma', photoUrl: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { name: 'Priya Singh', photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { name: 'Ravi Kumar', photoUrl: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { name: 'Sunita Patel', photoUrl: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { name: 'Vikas Gupta', photoUrl: 'https://randomuser.me/api/portraits/men/5.jpg' },
  { name: 'Neha Verma', photoUrl: 'https://randomuser.me/api/portraits/women/6.jpg' },
  { name: 'Suresh Yadav', photoUrl: 'https://randomuser.me/api/portraits/men/7.jpg' },
  { name: 'Anjali Mehra', photoUrl: 'https://randomuser.me/api/portraits/women/8.jpg' },
  { name: 'Deepak Joshi', photoUrl: 'https://randomuser.me/api/portraits/men/9.jpg' },
  { name: 'Meena Rani', photoUrl: 'https://randomuser.me/api/portraits/women/10.jpg' },
];

async function addContacts() {
  const batch = db.batch();
  contacts.forEach((contact) => {
    const ref = db.collection('contacts').doc();
    batch.set(ref, contact);
  });
  await batch.commit();
  console.log('Sample contacts added to Firestore!');
  process.exit(0);
}

addContacts().catch((err) => {
  console.error('Error adding contacts:', err);
  process.exit(1);
});

// Add demo user with balance
async function addDemoUserBalance() {
  const userId = 'demoUser';
  await db.collection('users').doc(userId).set({ balance: 100000 }, { merge: true });
  console.log('Demo user balance set to 1,00,000 rupees!');
}

addDemoUserBalance().catch((err) => {
  console.error('Error setting demo user balance:', err);
  process.exit(1);
}); 