const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
// adiciona cliente Gemini (opcional, só inicializa se tiver a chave)
let genAI = null;
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  if (process.env.GEMINI_API_KEY) {
    // inicializa cliente (biblioteca espera apiKey)
    genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('Gemini client inicializado.');
  } else {
    console.log('GEMINI_API_KEY não definida — Gemini endpoints estarão desabilitados.');
  }
} catch (e) {
  console.warn('@google/generative-ai não instalado ou falha ao require — endpoints Gemini ficarão desabilitados.', e.message);
}

let firestoreConfig = {};
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  try {
    firestoreConfig = { credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON) };
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

// ---- NEW: Gemini text generation endpoint ----
app.post('/api/generate-ideas', async (req, res) => {
  const { prompt, maxTokens = 300 } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });
  if (!genAI) return res.status(500).json({ error: 'Gemini client not configured (GEMINI_API_KEY missing or lib not installed).' });

  try {
    // usa a API de geração se disponível na lib
    const model = genAI.getGenerativeModel ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;
    if (!model || typeof model.generate !== 'function') {
      return res.status(500).json({ error: 'Generative model not available with current SDK.' });
    }

    const result = await model.generate({
      prompt: { text: prompt },
      temperature: 0.7,
      maxOutputTokens: maxTokens
    });

    // tenta extrair texto de forma genérica
    let text = null;
    if (result && result.candidates && result.candidates[0] && result.candidates[0].content) {
      text = result.candidates[0].content;
    } else if (result && result.output) {
      text = JSON.stringify(result.output);
    } else {
      text = JSON.stringify(result);
    }

    res.json({ text });
  } catch (err) {
    console.error('Gemini generate error:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// ---- NEW: Upload + analyze-image (faz upload ao GCS e retorna URL; análise com Gemini é opcional) ----
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    // salva no GCS
    const name = `${Date.now()}-${req.file.originalname.replace(/\s+/g,'_')}`;
    const file = bucket.file(name);
    await file.save(req.file.buffer, {
      resumable: false,
      contentType: req.file.mimetype,
      metadata: { cacheControl: 'public, max-age=31536000' }
    });
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURIComponent(name)}`;

    // opção: tentar análise se genAI está disponível (observação: análise multimodal depende da SDK/API)
    if (genAI && genAI.getGenerativeModel) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-image' });
        if (model && typeof model.generate === 'function') {
          // tentativa genérica de análise — algumas SDKs podem esperar outro formato
          const analysis = await model.generate({
            prompt: { text: `Analise a imagem em: ${publicUrl}. Liste itens detectados e possíveis descrições.` },
            maxOutputTokens: 300
          });
          return res.status(201).json({ url: publicUrl, analysis: analysis?.candidates?.[0]?.content || analysis });
        }
      } catch (aiErr) {
        console.warn('Gemini image analysis failed (non-fatal):', aiErr.message || aiErr);
      }
    }

    // fallback: retorna apenas a URL do upload
    res.status(201).json({ url: publicUrl });
  } catch (error) {
    console.error('Upload/analyze error', error);
    res.status(500).json({ error: error.message || String(error) });
  }
});

// export app for serverless (Vercel). Only listen when run locally.
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}