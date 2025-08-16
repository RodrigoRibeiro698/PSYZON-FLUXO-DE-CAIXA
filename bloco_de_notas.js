/*
  Bloco de notas — versão modernizada
  - melhor estrutura de dados (tags, color, checklist)
  - debounce/autosave + save que usa File System Access quando disponível
  - undo/redo stack (editor)
  - checklist sincronizado bidirecional com o conteúdo (- [ ] / - [x])
  - drag & drop robusto para checklist
  - event delegation, menos repetição, mais previsível
  - pequenas melhorias de UX: keyboard shortcuts, copy/share, toast
*/
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* Config */
  const LS_KEY = 'psyzon_notes_v3';
  const LS_ACTIVE = 'psyzon_active_note_v3';
  const AUTOSAVE_MS = 700;
  const MAX_UNDO = 200;

  /* DOM refs (fail fast if essential nodes missing) */
  const el = id => document.getElementById(id);
  const required = ['notepad-editor','notes-list','new-tab-btn','note-title','save-file-btn','add-check-item-input','add-check-item-btn','checklist-list','checklist-progress'];
  for (const id of required) {
    if (!el(id)) console.warn(`DOM missing: #${id}`);
  }

  const editor = el('notepad-editor');
  const notesListEl = el('notes-list');
  const newTabBtn = el('new-tab-btn');
  const noteTitleInput = el('note-title');
  const saveFileBtn = el('save-file-btn');

  const addCheckInput = el('add-check-item-input');
  const addCheckBtn = el('add-check-item-btn');
  const checklistList = el('checklist-list');
  const checklistProgress = el('checklist-progress');
  const lineNumbers = el('line-numbers');

  const searchInput = el('search-input');
  const sortSelect = el('sort-select');
  const showPinnedToggle = el('show-pinned-toggle');

  /* State */
  let notes = [];
  let activeNoteId = null;
  let autosaveTimer = null;
  let undoStack = [];
  let redoStack = [];
  let isTyping = false;
  let dragSrcIndex = null;

  /* Utilities */
  const now = () => Date.now();
  const idNow = () => Math.floor(Math.random()*1e9) + now();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const escapeHtml = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const debounce = (fn, ms) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
  const timeStr = ts => new Date(ts).toLocaleString();

  /* Storage */
  const loadNotes = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      notes = raw ? JSON.parse(raw) : [];
      // normalize shape
      notes = notes.map(n => ({
        id: n.id || idNow(),
        title: n.title || '',
        content: n.content || '',
        pinned: !!n.pinned,
        tags: n.tags || [],
        color: n.color || '#10b981',
        checklist: Array.isArray(n.checklist) ? n.checklist : [],
        createdAt: n.createdAt || now(),
        updatedAt: n.updatedAt || now()
      }));
      activeNoteId = parseInt(localStorage.getItem(LS_ACTIVE), 10) || (notes[0] && notes[0].id) || null;
    } catch (err) {
      console.error('Failed to load notes', err);
      notes = [];
      activeNoteId = null;
    }
  };
  const persist = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(notes));
    if (activeNoteId) localStorage.setItem(LS_ACTIVE, String(activeNoteId));
    else localStorage.removeItem(LS_ACTIVE);
  };

  /* Editor undo/redo */
  const pushUndo = (snapshot) => {
    undoStack.push(snapshot);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  };
  const snapshot = () => ({ content: editor.value, title: noteTitleInput.value });
  const doUndo = () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    const s = undoStack.pop();
    applySnapshot(s);
  };
  const doRedo = () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    const s = redoStack.pop();
    applySnapshot(s);
  };
  const applySnapshot = (s) => {
    if (!s) return;
    editor.value = s.content;
    noteTitleInput.value = s.title;
    updateLineNumbers();
    parseChecklistFromContent();
    scheduleAutosaveImmediate();
  };

  /* Notes api */
  const createNote = (content = '') => {
    const n = {
      id: idNow(),
      title: deriveTitle(content),
      content,
      pinned: false,
      tags: [],
      color: '#10b981',
      checklist: [],
      createdAt: now(),
      updatedAt: now()
    };
    notes.unshift(n);
    activeNoteId = n.id;
    persist();
    renderNotesList();
    openNote(n.id);
    return n;
  };

  const duplicateNote = (nid) => {
    const src = notes.find(n => n.id === nid); if (!src) return;
    const copy = { ...src, id: idNow(), title: (src.title||'') + ' (cópia)', createdAt: now(), updatedAt: now() };
    notes.unshift(copy);
    persist();
    renderNotesList();
    openNote(copy.id);
  };

  const deleteNote = (nid) => {
    const i = notes.findIndex(n => n.id === nid); if (i < 0) return;
    if (!confirm('Excluir nota permanentemente?')) return;
    notes.splice(i,1);
    if (notes.length) { activeNoteId = notes[0].id; } else { createNote(''); }
    persist();
    renderNotesList();
    openNote(activeNoteId);
  };

  const saveActiveNote = (opts = {}) => {
    const n = notes.find(x => x.id === activeNoteId); if (!n) return;
    n.content = editor.value;
    n.title = noteTitleInput.value || deriveTitle(n.content);
    n.updatedAt = now();
    // sync checklist structure
    n.checklist = syncChecklistFromContent();
    if (opts.noPersist !== true) persist();
    renderNotesList();
  };

  /* Title derivation */
  const deriveTitle = (content) => {
    const firstNonEmpty = (content||'').split('\n').find(l => l.trim());
    return (firstNonEmpty && firstNonEmpty.slice(0, 60)) || `Nova Nota ${notes.length + 1}`;
  };

  /* Render notes list */
  const renderNotesList = () => {
    const q = (searchInput && searchInput.value || '').toLowerCase();
    const sort = (sortSelect && sortSelect.value) || 'updated_desc';
    let list = notes.slice();

    if (showPinnedToggle && showPinnedToggle._onlyPinned) list = list.filter(n => n.pinned);
    if (q) list = list.filter(n => (n.title + ' ' + n.content + ' ' + (n.tags||[]).join(' ')).toLowerCase().includes(q));
    list.sort((a,b) => {
      if (sort === 'updated_desc') return b.updatedAt - a.updatedAt;
      if (sort === 'updated_asc') return a.updatedAt - b.updatedAt;
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      return b.updatedAt - a.updatedAt;
    });

    notesListEl.innerHTML = '';
    for (const n of list) {
      const row = document.createElement('div');
      row.className = `note-row p-2 rounded cursor-pointer flex gap-2 ${n.id === activeNoteId ? 'active' : 'hover'}`;
      row.dataset.id = n.id;

      const colorBar = document.createElement('div');
      colorBar.style.width = '8px';
      colorBar.style.height = '40px';
      colorBar.style.borderRadius = '6px';
      colorBar.style.background = n.color || '#10b981';
      colorBar.style.flexShrink = '0';

      const main = document.createElement('div');
      main.className = 'flex-1';

      const head = document.createElement('div');
      head.className = 'flex justify-between items-start gap-2';

      const title = document.createElement('div');
      title.className = 'text-sm font-medium';
      title.textContent = n.title || 'Sem título';

      const date = document.createElement('div');
      date.className = 'text-2xs text-gray-400';
      date.textContent = new Date(n.updatedAt).toLocaleDateString();

      head.appendChild(title);
      head.appendChild(date);

      const preview = document.createElement('div');
      preview.className = 'text-xs text-gray-400 mt-1';
      preview.textContent = (n.content || '').split('\n')[0] || '';

      main.appendChild(head);
      main.appendChild(preview);

      row.appendChild(colorBar);
      row.appendChild(main);

      row.addEventListener('click', () => openNote(n.id));
      notesListEl.appendChild(row);
    }
  };

  /* Open note */
  const openNote = (nid) => {
    const n = notes.find(x => x.id === nid);
    if (!n) return;
    activeNoteId = nid;
    noteTitleInput.value = n.title;
    editor.value = n.content || '';
    updateLineNumbers();
    // initialize undo/redo stacks
    undoStack = []; redoStack = [];
    pushUndo(snapshot());
    parseChecklistFromContent();
    persist();
    renderNotesList();
    editor.focus();
  };

  /* Editor helpers */
  const updateLineNumbers = () => {
    if (!lineNumbers) return;
    const lines = (editor.value||'').split('\n').length || 1;
    lineNumbers.innerHTML = Array.from({length:lines}, (_,i)=>i+1).join('<br>');
  };

  editor && editor.addEventListener('input', () => {
    // record undo step only on "settled" typing to avoid flooding
    if (!isTyping) { pushUndo(snapshot()); isTyping = true; setTimeout(()=>isTyping=false, 600); }
    updateLineNumbers();
    scheduleAutosave();
  });

  /* Autosave */
  const scheduleAutosaveImmediate = () => {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => saveActiveNote(), AUTOSAVE_MS);
  };
  const scheduleAutosave = debounce(() => saveActiveNote(), AUTOSAVE_MS);

  /* Checklist parsing / sync */
  // returns checklist array from editor content and sets global checklist UI
  const syncChecklistFromContent = () => {
    const lines = (editor.value || '').split('\n');
    const ck = [];
    lines.forEach((ln, idx) => {
      const m = ln.match(/^\s*-\s*\[(x|X|\s)\]\s+(.*)$/);
      if (m) ck.push({ text: m[2], checked: (m[1].toLowerCase() === 'x'), originalLine: idx });
    });
    renderChecklistUI(ck);
    updateChecklistProgress(ck);
    return ck;
  };

  // build editor content with checklist items placed (keeps other non-checklist lines in original order)
  const syncChecklistToContent = (ck) => {
    const lines = (editor.value || '').split('\n');
    const otherLines = lines.filter(ln => !ln.match(/^\s*-\s*\[(x|X|\s)\]\s+.*/));
    // append checklist block after otherLines (keeps simple approach)
    const newCheckLines = ck.map(i => `- [${i.checked ? 'x' : ' '}] ${i.text}`);
    const combined = otherLines.concat('', ...newCheckLines).join('\n');
    editor.value = combined;
    updateLineNumbers();
    scheduleAutosaveImmediate();
    // update active note model
    const n = notes.find(x => x.id === activeNoteId);
    if (n) { n.checklist = ck; n.updatedAt = now(); persist(); renderNotesList(); }
  };

  /* Checklist UI renderer (interactive) */
  const renderChecklistUI = (ckArr) => {
    checklistList.innerHTML = '';
    ckArr.forEach((it, idx) => {
      const row = document.createElement('div');
      row.className = 'check-row flex items-center gap-2 p-2 rounded bg-white/3';
      row.draggable = true;
      row.dataset.index = idx;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'check-item';
      checkbox.checked = !!it.checked;

      const textInput = document.createElement('input');
      textInput.type = 'text';
      textInput.className = 'check-text flex-1 bg-transparent';
      textInput.value = it.text || '';

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'check-delete';
      deleteBtn.title = 'Remover';
      deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

      const dragHandle = document.createElement('span');
      dragHandle.className = 'drag-handle cursor-grab text-gray-400';
      dragHandle.textContent = '⋮⋮';

      // events (use current idx captured by closure)
      checkbox.addEventListener('change', () => {
        it.checked = checkbox.checked;
        const updated = ckArr.slice();
        updateChecklistProgress(updated);
        syncChecklistToContent(updated);
      });
      textInput.addEventListener('input', () => {
        it.text = textInput.value;
        syncChecklistToContent(ckArr.slice());
      });
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        ckArr.splice(idx, 1);
        renderChecklistUI(ckArr);
        syncChecklistToContent(ckArr.slice());
      });

      // drag handlers
      row.addEventListener('dragstart', (ev) => {
        dragSrcIndex = idx;
        ev.dataTransfer.effectAllowed = 'move';
        row.classList.add('opacity-50');
      });
      row.addEventListener('dragend', () => {
        row.classList.remove('opacity-50');
        dragSrcIndex = null;
      });
      row.addEventListener('dragover', (ev) => { ev.preventDefault(); ev.dataTransfer.dropEffect = 'move'; });
      row.addEventListener('drop', (ev) => {
        ev.preventDefault();
        const destIndex = Number(row.dataset.index);
        if (Number.isFinite(dragSrcIndex) && dragSrcIndex !== destIndex) {
          const moved = ckArr.splice(dragSrcIndex, 1)[0];
          ckArr.splice(destIndex, 0, moved);
          renderChecklistUI(ckArr);
          syncChecklistToContent(ckArr.slice());
        }
      });

      row.appendChild(checkbox);
      row.appendChild(textInput);
      row.appendChild(deleteBtn);
      row.appendChild(dragHandle);
      checklistList.appendChild(row);
    });
    updateChecklistProgress(ckArr);
  };

  const updateChecklistProgress = (ckArr) => {
    const arr = ckArr || syncChecklistFromContent(); // if none provided, parse
    const total = arr.length;
    if (!total) { if (checklistProgress) checklistProgress.textContent = '0%'; return; }
    const done = arr.filter(i => i.checked).length;
    const pct = Math.round((done/total)*100);
    if (checklistProgress) checklistProgress.textContent = pct + '%';
  };

  /* Checklist add / controls */
  addCheckBtn && addCheckBtn.addEventListener('click', () => {
    const v = (addCheckInput.value || '').trim();
    if (!v) return;
    const ck = syncChecklistFromContent();
    ck.push({ text: v, checked: false });
    addCheckInput.value = '';
    syncChecklistToContent(ck);
    renderChecklistUI(ck);
  });
  addCheckInput && addCheckInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCheckBtn.click(); });

  // helpers: mark all / clear
  const checkAll = () => {
    const ck = syncChecklistFromContent().map(i => ({ ...i, checked:true }));
    renderChecklistUI(ck); syncChecklistToContent(ck);
  };
  const clearAll = () => {
    const ck = syncChecklistFromContent().map(i => ({ ...i, checked:false }));
    renderChecklistUI(ck); syncChecklistToContent(ck);
  };
  const checkAllBtn = el('check-all-btn'); if (checkAllBtn) checkAllBtn.addEventListener('click', checkAll);
  const clearChecksBtn = el('clear-checks-btn'); if (clearChecksBtn) clearChecksBtn.addEventListener('click', clearAll);

  /* Export / Save to file system */
  const downloadBlob = (blob, filename) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportTxt = (nid) => {
    const n = notes.find(x => x.id === nid); if (!n) return;
    const blob = new Blob([n.content || ''], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${(n.title||'nota').replace(/[^a-z0-9_\-]/gi,'_')}.txt`);
  };

  const exportHtml = (nid) => {
    const n = notes.find(x => x.id === nid); if (!n) return;
    const html = `<!doctype html><meta charset="utf-8"><title>${escapeHtml(n.title)}</title><body>${escapeHtml(n.content).replace(/\n/g,'<br>')}</body>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    downloadBlob(blob, `${(n.title||'nota').replace(/[^a-z0-9_\-]/gi,'_')}.html`);
  };

  // File System Access API (optional)
  const saveToDisk = async (nid) => {
    if (!window.showSaveFilePicker) { exportTxt(nid); return; }
    const n = notes.find(x=>x.id===nid); if (!n) return;
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: `${(n.title||'nota')}.txt`, types:[{description:'Text', accept:{'text/plain':['.txt']}}]});
      const writable = await handle.createWritable();
      await writable.write(n.content || '');
      await writable.close();
      alert('Arquivo salvo.');
    } catch (err) {
      console.warn('Save canceled/failed', err);
    }
  };

  /* Toolbar & keyboard shortcuts */
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault(); saveActiveNote(); alert('Nota salva');
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); doUndo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); doRedo(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); wrapSelection('**','**'); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); wrapSelection('_','_'); }
  });

  const wrapSelection = (p, s) => {
    const start = editor.selectionStart, end = editor.selectionEnd;
    const val = editor.value;
    editor.value = val.slice(0,start) + p + val.slice(start,end) + s + val.slice(end);
    editor.selectionStart = start + p.length; editor.selectionEnd = end + p.length;
    editor.dispatchEvent(new Event('input'));
  };

  /* Sync helpers between editor and checklist when user loads/saves */
  const parseChecklistFromEditorRaw = () => {
    // directly return checklist array
    const lines = (editor.value||'').split('\n');
    const out = [];
    lines.forEach((ln, i) => {
      const m = ln.match(/^\s*-\s*\[(x|X|\s)\]\s+(.*)$/);
      if (m) out.push({ text: m[2], checked: (m[1].toLowerCase() === 'x'), originalLine: i });
    });
    return out;
  };

  // Called by parse/sync functions
  const parseChecklistFromContent = () => {
    const ck = parseChecklistFromEditorRaw();
    renderChecklistUI(ck);
    updateChecklistProgress(ck);
    return ck;
  };

  /* UI small helpers */
  const applyToActiveNote = (mutator) => {
    const n = notes.find(x => x.id === activeNoteId);
    if (!n) return;
    mutator(n);
    n.updatedAt = now();
    persist();
    renderNotesList();
  };

  /* Event wiring for top-level actions */
  newTabBtn && newTabBtn.addEventListener('click', () => createNote(''));
  saveFileBtn && saveFileBtn.addEventListener('click', () => saveToDisk(activeNoteId));
  el('export-btn') && el('export-btn').addEventListener('click', () => exportTxt(activeNoteId));
  el('duplicate-btn') && el('duplicate-btn').addEventListener('click', () => duplicateNote(activeNoteId));
  el('delete-btn') && el('delete-btn').addEventListener('click', () => deleteNote(activeNoteId));
  el('pin-btn') && el('pin-btn').addEventListener('click', () => applyToActiveNote(n => n.pinned = !n.pinned));
  el('uppercase-btn') && el('uppercase-btn').addEventListener('click', () => { editor.value = editor.value.toUpperCase(); editor.dispatchEvent(new Event('input')); });
  el('lowercase-btn') && el('lowercase-btn').addEventListener('click', () => { editor.value = editor.value.toLowerCase(); editor.dispatchEvent(new Event('input')); });

  // title change
  noteTitleInput && noteTitleInput.addEventListener('input', () => {
    const n = notes.find(x => x.id === activeNoteId); if (!n) return;
    n.title = noteTitleInput.value; n.updatedAt = now(); persist(); renderNotesList();
  });

  // search/sort/pinned toggle
  searchInput && searchInput.addEventListener('input', () => renderNotesList());
  sortSelect && sortSelect.addEventListener('change', () => renderNotesList());
  showPinnedToggle && showPinnedToggle.addEventListener('click', () => {
    showPinnedToggle._onlyPinned = !showPinnedToggle._onlyPinned;
    showPinnedToggle.textContent = showPinnedToggle._onlyPinned ? 'Mostrando fixadas' : 'Mostrar apenas fixadas';
    renderNotesList();
  });

  // checklist actions handled above on add buttons

  // initial load
  loadNotes();
  if (!notes.length) createNote('');
  if (!activeNoteId || !notes.some(n => n.id === activeNoteId)) activeNoteId = notes[0].id;
  openNote(activeNoteId);
  renderNotesList();

  // expose small API for console debugging
  window.__psyzon_notes = { notes, createNote, saveActiveNote, exportTxt, exportHtml };
});