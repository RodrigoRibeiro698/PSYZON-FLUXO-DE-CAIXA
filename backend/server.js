const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

let firestoreConfig = {};
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    firestoreConfig = { credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON) };
    // optionally set projectId if missing in credentials
    if (!firestoreConfig.projectId && firestoreConfig.credentials && firestoreConfig.credentials.project_id) {
      firestoreConfig.projectId = firestoreConfig.credentials.project_id;
    }
  } catch (e) {
    console.error('Failed to parse GOOGLE_CREDENTIALS_JSON env var:', e);
  }
}

// fallback: if running locally and GOOGLE_APPLICATION_CREDENTIALS points to a file, let client lib pick it up (no config)
const firestore = new Firestore(Object.keys(firestoreConfig).length ? firestoreConfig : undefined);
const storage = new Storage(Object.keys(firestoreConfig).length ? firestoreConfig : undefined);

const BUCKET_NAME = process.env.BUCKET_NAME || 'psyzon-dashboard-arquivos-rodrigo';
const bucket = storage.bucket(BUCKET_NAME);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumenta o limite para aceitar imagens em base64

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Rota de Teste
app.get('/', (req, res) => {
  res.send('Servidor do FLUXO DE CAIXA PSYZON está no ar! 🚀');
});

// --- API PARA TRANSACTIONS ---
app.get('/api/transactions', async (req, res) => {
    try {
        const snapshot = await firestore.collection('transactions').get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(items);
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/transactions', async (req, res) => {
    try {
        const newItem = req.body;
        const docRef = await firestore.collection('transactions').add(newItem);
        res.status(201).json({ id: docRef.id, ...newItem });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedItem = req.body;
        await firestore.collection('transactions').doc(id).set(updatedItem, { merge: true });
        res.status(200).json({ id, ...updatedItem });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await firestore.collection('transactions').doc(id).delete();
        res.status(200).json({ message: 'Transação deletada com sucesso.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- API PARA CLIENTS ---
app.get('/api/clients', async (req, res) => {
    try {
        const snapshot = await firestore.collection('clients').get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(items);
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/clients', async (req, res) => {
    try {
        const newItem = req.body;
        const docRef = await firestore.collection('clients').add(newItem);
        res.status(201).json({ id: docRef.id, ...newItem });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedItem = req.body;
        await firestore.collection('clients').doc(id).set(updatedItem, { merge: true });
        res.status(200).json({ id, ...updatedItem });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await firestore.collection('clients').doc(id).delete();
        res.status(200).json({ message: 'Cliente deletado com sucesso.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- API PARA PRODUCTION ORDERS ---
app.get('/api/orders', async (req, res) => {
    try {
        const snapshot = await firestore.collection('production_orders').get();
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(items);
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.post('/api/orders', async (req, res) => {
    try {
        const newItem = req.body;
        const docRef = await firestore.collection('production_orders').add(newItem);
        res.status(201).json({ id: docRef.id, ...newItem });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedItem = req.body;
        await firestore.collection('production_orders').doc(id).set(updatedItem, { merge: true });
        res.status(200).json({ id, ...updatedItem });
    } catch (error) { res.status(500).json({ error: error.message }); }
});
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await firestore.collection('production_orders').doc(id).delete();
        res.status(200).json({ message: 'Pedido deletado com sucesso.' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// exporta o app para o runtime serverless (Vercel) e, apenas se rodando diretamente, inicia o listener local
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}