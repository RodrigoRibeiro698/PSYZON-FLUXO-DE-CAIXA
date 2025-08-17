const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

const firestore = new Firestore();
const storage = new Storage();
const bucket = storage.bucket('psyzon-dashboard-arquivos-rodrigo');

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});