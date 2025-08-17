window.aiClient = {
  async generateIdeas(prompt, opts = {}) {
    const res = await fetch('/api/generate-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, maxTokens: opts.maxTokens || 300 })
    });
    if (!res.ok) throw new Error(`AI generate failed: ${res.status}`);
    return res.json();
  },

  async analyzeImage(file) {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/analyze-image', { method: 'POST', body: fd });
    if (!res.ok) throw new Error(`Image analyze failed: ${res.status}`);
    return res.json();
  }
};