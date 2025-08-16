// Minimal Supabase REST helper (browser)
// Configure: defina as variáveis SUPABASE_URL e SUPABASE_KEY abaixo ou exponha via build/env
const SUPABASE_URL = window.SUPABASE_URL || '<COLE_AQUI_SEU_SUPABASE_URL>';
const SUPABASE_KEY = window.SUPABASE_KEY || '<COLE_AQUI_SUA_SUPABASE_ANON_KEY>';
const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

const supabase = {
  // transactions
  async getTransactions(month = null) {
    let url = `${SUPABASE_URL}/rest/v1/transactions`;
    const params = [];
    if (month) params.push(`date=like.${encodeURIComponent(month + '%')}`);
    params.push('order=created_at.desc');
    if (params.length) url += `?${params.join('&')}`;
    const r = await fetch(url, { headers: SB_HEADERS });
    if (!r.ok) throw new Error('Falha ao buscar transações');
    return await r.json();
  },

  async createTransaction(tx) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: 'POST',
      headers: SB_HEADERS,
      body: JSON.stringify(tx)
    });
    if (!r.ok) throw new Error('Falha ao criar transação');
    return await r.json(); // array com row criada
  },

  async updateTransaction(id, tx) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/transactions?id=eq.${id}`, {
      method: 'PATCH',
      headers: SB_HEADERS,
      body: JSON.stringify(tx)
    });
    if (!r.ok) throw new Error('Falha ao atualizar transação');
    return true;
  },

  async deleteTransaction(id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/transactions?id=eq.${id}`, {
      method: 'DELETE',
      headers: SB_HEADERS
    });
    if (!r.ok) throw new Error('Falha ao deletar transação');
    return true;
  },

  // clients
  async getClients() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/clients?order=name.asc`, { headers: SB_HEADERS });
    if (!r.ok) throw new Error('Falha ao buscar clientes');
    return await r.json();
  },
  async createClient(c) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/clients`, { method: 'POST', headers: SB_HEADERS, body: JSON.stringify(c) });
    if (!r.ok) throw new Error('Falha ao criar cliente');
    return await r.json();
  },

  // production orders (printing stored as jsonb)
  async getOrders() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/production_orders?order=deadline.asc`, { headers: SB_HEADERS });
    if (!r.ok) throw new Error('Falha ao buscar pedidos');
    return await r.json();
  },
  async createOrder(o) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/production_orders`, { method: 'POST', headers: SB_HEADERS, body: JSON.stringify(o) });
    if (!r.ok) throw new Error('Falha ao criar pedido');
    return await r.json();
  },
  async updateOrder(id, o) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/production_orders?id=eq.${id}`, { method: 'PATCH', headers: SB_HEADERS, body: JSON.stringify(o) });
    if (!r.ok) throw new Error('Falha ao atualizar pedido');
    return true;
  },

  // storage upload -> retorna public URL (assume bucket 'uploads' público)
  async uploadFile(file, bucket = 'uploads') {
    const name = `${Date.now()}-${file.name.replace(/\s+/g,'_')}`;
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/${bucket}/${encodeURIComponent(name)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SUPABASE_KEY}` },
      body: fd
    });
    if (!r.ok) throw new Error('Upload falhou');
    // public URL:
    return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${encodeURIComponent(name)}`;
  }
};
// expose
window.supabase = supabase;