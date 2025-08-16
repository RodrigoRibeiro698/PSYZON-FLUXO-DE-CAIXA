document.addEventListener('DOMContentLoaded', () => {
    const addClientBtn = document.getElementById('add-client-btn');
    const clientModal = document.getElementById('client-modal');
    const clientForm = document.getElementById('client-form');
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

    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    let editingClientId = null;
    let tempClientPhotoData = null;
    let tempProductPhotoData = null;

    const saveClients = () => {
        localStorage.setItem('clients', JSON.stringify(clients));
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
                const compressedData = await handleImageUpload(e.target.files[0]);
                tempDataCallback(compressedData);
                preview.src = compressedData;
                preview.classList.remove('hidden');
                textElement.classList.add('hidden');
            }
        });
    };

    setupDropzone(clientPhotoDropzone, clientPhotoInput, clientPhotoPreview, clientPhotoText, data => tempClientPhotoData = data);
    setupDropzone(productPhotoDropzone, productPhotoInput, productPhotoPreview, productPhotoText, data => tempProductPhotoData = data);

    const resetPreviews = () => {
        clientPhotoPreview.classList.add('hidden'); clientPhotoText.classList.remove('hidden');
        productPhotoPreview.classList.add('hidden'); productPhotoText.classList.remove('hidden');
        clientPhotoPreview.src = ''; productPhotoPreview.src = '';
        tempClientPhotoData = null; tempProductPhotoData = null;
    };

    const openModal = (clientId = null) => {
        editingClientId = clientId;
        clientForm.reset();
        resetPreviews();
        if (clientId) {
            const client = clients.find(c => c.id === clientId);
            clientModalTitle.textContent = 'Editar Cliente';
            clientNameInput.value = client.name;
            clientGenderSelect.value = client.gender || 'not_informed';
            clientPhoneInput.value = client.phone || '';
            clientEmailInput.value = client.email || '';
            if (client.clientPhotoData) { clientPhotoPreview.src = client.clientPhotoData; clientPhotoPreview.classList.remove('hidden'); clientPhotoText.classList.add('hidden'); }
            if (client.productPhotoData) { productPhotoPreview.src = client.productPhotoData; productPhotoPreview.classList.remove('hidden'); productPhotoText.classList.add('hidden'); }
        } else {
            clientModalTitle.textContent = 'Novo Cliente';
        }
        clientModal.classList.remove('hidden');
    };

    const closeModal = () => {
        clientModal.classList.add('hidden');
        editingClientId = null;
    };

    clientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const clientName = clientNameInput.value.trim();
        if (!clientName) { alert('O nome do cliente não pode estar vazio.'); return; }

        const clientData = {
            name: clientName,
            gender: clientGenderSelect.value,
            phone: clientPhoneInput.value.trim(),
            email: clientEmailInput.value.trim(),
        };
        if (tempClientPhotoData) clientData.clientPhotoData = tempClientPhotoData;
        if (tempProductPhotoData) clientData.productPhotoData = tempProductPhotoData;

        if (editingClientId) {
            const clientIndex = clients.findIndex(c => c.id === editingClientId);
            clients[clientIndex] = { ...clients[clientIndex], ...clientData };
        } else {
            const newClient = { id: Date.now(), ...clientData };
            clients.push(newClient);
        }
        saveClients();
        renderClientList();
        closeModal();
    });

    addClientBtn.addEventListener('click', () => openModal());
    cancelClientBtn.addEventListener('click', closeModal);

    const removeClient = (clientId) => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            clients = clients.filter(c => c.id !== clientId);
            saveClients();
            let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
            transactions.forEach(t => { if (t.clientId === clientId) t.clientId = null; });
            localStorage.setItem('transactions', JSON.stringify(transactions));
            let productionOrders = JSON.parse(localStorage.getItem('production_orders')) || [];
            productionOrders.forEach(o => { if (o.clientId === clientId) o.clientId = null; });
            localStorage.setItem('production_orders', JSON.stringify(productionOrders));
            renderClientList();
        }
    };

    const renderClientList = () => {
        const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        
        const searchTerm = searchClientInput.value.toLowerCase();
        const sortBy = sortBySelect.value;
        const filterGender = filterGenderSelect.value;

        let filteredClients = clients.filter(client => {
            const nameMatch = client.name.toLowerCase().includes(searchTerm);
            const genderMatch = filterGender === 'all' || (client.gender || 'not_informed') === filterGender;
            return nameMatch && genderMatch;
        });

        const clientsWithProfit = filteredClients.map(client => {
            const clientTransactions = transactions.filter(t => t.clientId === client.id);
            const totalIncome = clientTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
            const totalExpense = clientTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
            const netProfit = totalIncome - totalExpense;
            return { ...client, totalIncome, netProfit };
        });

        if (sortBy === 'profit_desc') {
            clientsWithProfit.sort((a, b) => b.netProfit - a.netProfit);
        } else { // name_asc
            clientsWithProfit.sort((a, b) => a.name.localeCompare(b.name));
        }

        clientListEl.innerHTML = '';
        if (clientsWithProfit.length === 0) {
            clientListEl.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Nenhum cliente encontrado com os filtros atuais.</td></tr>`;
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
                const phoneNumber = client.phone.replace(/\D/g, '');
                if (phoneNumber) {
                    whatsappButtonHTML = `<a href="https://wa.me/55${phoneNumber}" target="_blank" class="inline-block" title="Conversar no WhatsApp" aria-label="WhatsApp">
                        <!-- WhatsApp SVG (substituído pelo ícone fornecido, reduzido para 20x20) -->
                        <svg width="20" height="20" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                          <defs>
                            <linearGradient id="wa-grad-client" x1="0" x2="1" y1="0" y2="1">
                              <stop offset="0" stop-color="#61fd7d"/>
                              <stop offset="1" stop-color="#2bb826"/>
                            </linearGradient>
                          </defs>
                          <path fill="url(#wa-grad-client)" d="M783.302 243.246c-69.329-69.387-161.529-107.619-259.763-107.658-202.402 0-367.133 164.668-367.214 367.072-.026 64.699 16.883 127.854 49.017 183.522l-52.096 190.229 194.665-51.047c53.636 29.244 114.022 44.656 175.482 44.682h.151c202.382 0 367.128-164.688 367.21-367.094.039-98.087-38.121-190.319-107.452-259.706z"/>
                          <g>
                            <path fill="#FFF" d="M523.544 808.047h-.125c-54.767-.021-108.483-14.729-155.344-42.529l-11.146-6.612-115.517 30.293 30.834-112.592-7.259-11.544c-30.552-48.579-46.688-104.729-46.664-162.379.066-168.229 136.985-305.096 305.339-305.096 81.521.031 158.154 31.811 215.779 89.482s89.342 134.332 89.312 215.859c-.066 168.243-136.984 305.118-305.209 305.118zm167.415-228.515c-9.177-4.591-54.286-26.782-62.697-29.843-8.41-3.062-14.526-4.592-20.645 4.592-6.115 9.182-23.699 29.843-29.053 35.964-5.352 6.122-10.704 6.888-19.879 2.296-9.176-4.591-38.74-14.277-73.786-45.526-27.275-24.319-45.691-54.359-51.043-63.543-5.352-9.183-.569-14.146 4.024-18.72 4.127-4.109 9.175-10.713 13.763-16.069 4.587-5.355 6.117-9.183 9.175-15.304 3.059-6.122 1.529-11.479-.765-16.07-2.293-4.591-20.644-49.739-28.29-68.104-7.447-17.886-15.013-15.466-20.645-15.747-5.346-.266-11.469-.322-17.585-.322s-16.057 2.295-24.467 11.478-32.113 31.374-32.113 76.521c0 45.147 32.877 88.764 37.465 94.885 4.588 6.122 64.699 98.771 156.741 138.502 21.892 9.45 38.982 15.094 52.308 19.322 21.98 6.979 41.982 5.995 57.793 3.634 17.628-2.633 54.284-22.189 61.932-43.615 7.646-21.427 7.646-39.791 5.352-43.617-2.294-3.826-8.41-6.122-17.585-10.714z"/>
                          </g>
                        </svg>
                      </a>`;
                }
            }
            row.innerHTML = `
                <td class="p-3"><div class="flex items-center">${clientPhotoHTML}<span class="font-bold">${client.name}</span></div></td>
                <td class="p-3"><div class="flex items-center gap-4">${productPhotoHTML}${whatsappButtonHTML}</div></td>
                <td class="p-3 text-green-400 font-semibold">${formatCurrency(client.totalIncome)}</td>
                <td class="p-3 font-semibold ${profitColorClass}">${formatCurrency(client.netProfit)}</td>
                <td class="p-3"><div class="flex items-center gap-2"><button onclick="window.editClient(${client.id})" class="text-gray-500 hover:text-cyan-400" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg></button><button onclick="window.removeClient(${client.id})" class="text-gray-500 hover:text-red-400" title="Excluir"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button></div></td>
            `;
            clientListEl.appendChild(row);
        });
    };

    window.editClient = (clientId) => openModal(clientId);
    window.removeClient = removeClient;

    searchClientInput.addEventListener('input', renderClientList);
    sortBySelect.addEventListener('change', renderClientList);
    filterGenderSelect.addEventListener('change', renderClientList);

    renderClientList();
});