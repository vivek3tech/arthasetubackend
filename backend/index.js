const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// GET /contacts - fetch contacts from Firestore
app.get('/contacts', async (req, res) => {
  try {
    const snapshot = await db.collection('contacts').get();
    const contacts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET /balance/:userId - fetch user balance from Firestore
app.get('/balance/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const data = userDoc.data();
    res.json({ balance: data.balance });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// POST /send-money - deduct amount and log transaction
app.post('/send-money', async (req, res) => {
  const { fromUserId, toName, toPhotoUrl, amount } = req.body;
  if (!fromUserId || !toName || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  try {
    const userRef = db.collection('users').doc(fromUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    if (userData.balance < amt) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    const newBalance = userData.balance - amt;
    await userRef.update({ balance: newBalance });
    const transactionId = uuidv4();
    const transaction = {
      transactionId,
      from: fromUserId,
      to: toName,
      toPhotoUrl: toPhotoUrl || '',
      amount: amt,
      balance: newBalance,
      timestamp: new Date().toISOString(),
    };
    await db.collection('transactions').doc(transactionId).set(transaction);
    res.json({ transactionId, newBalance });
  } catch (error) {
    console.error('Error sending money:', error);
    res.status(500).json({ error: 'Failed to send money' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
}); 