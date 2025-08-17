document.addEventListener('DOMContentLoaded', () => {
    const apiBaseUrl = '/api'; // 

    const addClientBtn = document.getElementById('add-client-btn');
    const clientModal = document.getElementById('client-modal');
    const clientForm = document.getElementById('client-form');
    const saveClientBtn = document.getElementById('save-client-btn');
    const clientModalTitle = document.getElementById('client-modal-title');
    const cancelClientBtn = document.getElementById('cancel-client-btn');
    const clientListEl = document.getElementById('client-list');
    
    const clientNameInput = document.getElementById('client-name');
    const clientGenderSelect = document.getElementById('client-gender');
    const clientPhoneInput = document.getElementById('client-phone');
    const clientEmailInput = document.getElementById('client-email');

    const clientPhotoDropzone = document.getElementById('client-photo-dropzone');
    const clientPhotoInput = document.getElementById('client-photo-input');
    const clientPhotoPreview = document.getElementById('client-photo-preview');
    const clientPhotoText = document.getElementById('client-photo-text');

    const productPhotoDropzone = document.getElementById('product-photo-dropzone');
    const productPhotoInput = document.getElementById('product-photo-input');
    const productPhotoPreview = document.getElementById('product-photo-preview');
    const productPhotoText = document.getElementById('product-photo-text');

    const searchClientInput = document.getElementById('search-client');
    const sortBySelect = document.getElementById('sort-by');
    const filterGenderSelect = document.getElementById('filter-gender');

    let clients = [];
    let transactions = [];
    let editingClientId = null;
    let tempClientPhotoData = null;
    let tempProductPhotoData = null;

    const fetchData = async () => {
        try {
            const [clientsRes, transRes] = await Promise.all([
                fetch(`${apiBaseUrl}/clients`),
                fetch(`${apiBaseUrl}/transactions`)
            ]);
            clients = await clientsRes.json();
            transactions = await transRes.json();
            renderClientList();
        } catch (error) {
            console.error("Falha ao carregar dados:", error);
            if (clientListEl) clientListEl.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Erro ao conectar ao servidor. Verifique se ele está rodando.</td></tr>`;
        }
    };

    const formatCurrency = (amount) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleImageUpload = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 200; const MAX_HEIGHT = 200;
                    let width = img.width; let height = img.height;
                    if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                    else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
            reader.onerror = error => reject(error);
        });
    };
    
    const setupDropzone = (dropzone, input, preview, textElement, tempDataCallback) => {
        if (!dropzone || !input) return;
        dropzone.addEventListener('click', () => input.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-cyan-400'); });
        dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('border-cyan-400'); });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-cyan-400');
            if (e.dataTransfer.files.length) {
                input.files = e.dataTransfer.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        input.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files[0]) {
                try {
                    const compressedData = await handleImageUpload(e.target.files[0]);
                    tempDataCallback(compressedData);
                    if (preview) { preview.src = compressedData; preview.classList.remove('hidden'); }
                    if (textElement) textElement.classList.add('hidden');
                } catch (err) {
                    console.error('Erro ao processar imagem', err);
                }
            }
        });
    };

    setupDropzone(clientPhotoDropzone, clientPhotoInput, clientPhotoPreview, clientPhotoText, data => tempClientPhotoData = data);
    setupDropzone(productPhotoDropzone, productPhotoInput, productPhotoPreview, productPhotoText, data => tempProductPhotoData = data);

    const resetPreviews = () => {
        if (clientPhotoPreview) { clientPhotoPreview.classList.add('hidden'); clientPhotoPreview.src = ''; }
        if (clientPhotoText) clientPhotoText.classList.remove('hidden');
        if (productPhotoPreview) { productPhotoPreview.classList.add('hidden'); productPhotoPreview.src = ''; }
        if (productPhotoText) productPhotoText.classList.remove('hidden');
        tempClientPhotoData = null; tempProductPhotoData = null;
    };

    const openModal = (clientId = null) => {
        editingClientId = clientId;
        if (clientForm) clientForm.reset();
        resetPreviews();
        if (clientId) {
            const client = clients.find(c => c.id === clientId);
            if (!client) return;
            if (clientModalTitle) clientModalTitle.textContent = 'Editar Cliente';
            if (clientNameInput) clientNameInput.value = client.name || '';
            if (clientGenderSelect) clientGenderSelect.value = client.gender || 'not_informed';
            if (clientPhoneInput) clientPhoneInput.value = client.phone || '';
            if (clientEmailInput) clientEmailInput.value = client.email || '';
            if (client.clientPhotoData && clientPhotoPreview) { clientPhotoPreview.src = client.clientPhotoData; clientPhotoPreview.classList.remove('hidden'); if (clientPhotoText) clientPhotoText.classList.add('hidden'); }
            if (client.productPhotoData && productPhotoPreview) { productPhotoPreview.src = client.productPhotoData; productPhotoPreview.classList.remove('hidden'); if (productPhotoText) productPhotoText.classList.add('hidden'); }
        } else {
            if (clientModalTitle) clientModalTitle.textContent = 'Novo Cliente';
        }
        if (clientModal) clientModal.classList.remove('hidden');
    };

    const closeModal = () => {
        if (clientModal) clientModal.classList.add('hidden');
        editingClientId = null;
    };

    if (clientForm) {
        clientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!saveClientBtn) return;

            saveClientBtn.disabled = true;
            try {
                const fd = new FormData(clientForm);
                const payload = Object.fromEntries(fd.entries());
                // converter campos numéricos se necessário
                const res = await fetch(`${apiBaseUrl}/clients`, {
                    method: payload.id ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const txt = await res.text().catch(()=>res.statusText);
                    console.error('/api/clients error', res.status, txt);
                    alert('Erro ao salvar cliente: ' + (txt || res.status));
                    return;
                }
                await fetchData();
                closeModal && closeModal();
            } catch (err) {
                console.error('Erro no submit client:', err);
                alert('Erro de conexão ao salvar cliente.');
            } finally {
                saveClientBtn.disabled = false;
            }
        });
    }

    if (addClientBtn) addClientBtn.addEventListener('click', () => openModal());
    if (cancelClientBtn) cancelClientBtn.addEventListener('click', closeModal);

    const removeClient = async (clientId) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
        try {
            await fetch(`${apiBaseUrl}/clients/${clientId}`, { method: 'DELETE' });
            await fetchData();
        } catch (error) {
            console.error("Falha ao remover cliente:", error);
            alert("Erro ao remover cliente.");
        }
    };

    const renderClientList = () => {
        if (!clientListEl) return;
        const searchTerm = searchClientInput ? (searchClientInput.value || '').toLowerCase() : '';
        const sortBy = sortBySelect ? sortBySelect.value : 'name';
        const filterGender = filterGenderSelect ? filterGenderSelect.value : 'all';

        let filteredClients = clients.filter(client => {
            const nameMatch = (client.name || '').toLowerCase().includes(searchTerm);
            const genderMatch = filterGender === 'all' || (client.gender || 'not_informed') === filterGender;
            return nameMatch && genderMatch;
        });

        const clientsWithProfit = filteredClients.map(client => {
            const clientTransactions = transactions.filter(t => t.clientId === client.id);
            const totalIncome = clientTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
            const totalExpense = clientTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
            const netProfit = totalIncome - totalExpense;
            return { ...client, totalIncome, netProfit };
        });

        if (sortBy === 'profit_desc') {
            clientsWithProfit.sort((a, b) => b.netProfit - a.netProfit);
        } else {
            clientsWithProfit.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        clientListEl.innerHTML = '';
        if (clientsWithProfit.length === 0) {
            clientListEl.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Nenhum cliente encontrado.</td></tr>`;
            return;
        }

        clientsWithProfit.forEach(client => {
            const profitColorClass = client.netProfit >= 0 ? 'text-green-400' : 'text-red-400';
            const row = document.createElement('tr');
            row.className = 'hover:bg-white/5';
            
            const clientPhotoHTML = client.clientPhotoData ? `<img src="${client.clientPhotoData}" class="w-10 h-10 rounded-full object-cover mr-3 border-2 border-gray-600">` : `<div class="w-10 h-10 rounded-full mr-3 bg-gray-700 flex-shrink-0"></div>`;
            const productPhotoHTML = client.productPhotoData ? `<img src="${client.productPhotoData}" class="w-10 h-10 rounded-md object-cover border-2 border-gray-600">` : ``;

            let whatsappButtonHTML = '';
            if (client.phone) {
                const phoneNumber = (client.phone || '').replace(/\D/g, '');
                if (phoneNumber) {
                    whatsappButtonHTML = `<a href="https://wa.me/55${phoneNumber}" target="_blank" class="text-green-400 hover:text-green-300" title="Conversar no WhatsApp"><svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.687-1.475L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.505 1.789 6.47l-.547 2.001 2.002-.548z"/></svg></a>`;
                }
            }
            row.innerHTML = `
                <td class="p-3"><div class="flex items-center">${clientPhotoHTML}<span class="font-bold">${client.name || ''}</span></div></td>
                <td class="p-3"><div class="flex items-center gap-4">${productPhotoHTML}${whatsappButtonHTML}</div></td>
                <td class="p-3 text-green-400 font-semibold">${formatCurrency(client.totalIncome || 0)}</td>
                <td class="p-3 font-semibold ${profitColorClass}">${formatCurrency(client.netProfit || 0)}</td>
                <td class="p-3"><div class="flex items-center gap-2"><button onclick="window.editClient('${client.id}')" class="text-gray-500 hover:text-cyan-400" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg></button><button onclick="window.removeClient('${client.id}')" class="text-gray-500 hover:text-red-400" title="Excluir"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button></div></td>
            `;
            clientListEl.appendChild(row);
        });
    };

    window.editClient = (clientId) => openModal(clientId);
    window.removeClient = removeClient;

    if (searchClientInput) searchClientInput.addEventListener('input', renderClientList);
    if (sortBySelect) sortBySelect.addEventListener('change', renderClientList);
    if (filterGenderSelect) filterGenderSelect.addEventListener('change', renderClientList);

    fetchData();
});