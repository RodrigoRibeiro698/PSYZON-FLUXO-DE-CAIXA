document.addEventListener('DOMContentLoaded', () => {
    const addOrderBtn = document.getElementById('add-order-btn');
    const tabQuadro = document.getElementById('tab-quadro');
    const tabAfazeres = document.getElementById('tab-afazeres');
    const tabCortes = document.getElementById('tab-cortes');
    const viewQuadro = document.getElementById('view-quadro');
    const viewAfazeres = document.getElementById('view-afazeres');
    const viewCortes = document.getElementById('view-cortes');

    const columns = { todo: document.getElementById('column-todo'), doing: document.getElementById('column-doing'), done: document.getElementById('column-done') };

    const orderModal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    const orderModalTitle = document.getElementById('order-modal-title');
    const cancelOrderBtn = document.getElementById('cancel-order-btn');
    const orderDescriptionInput = document.getElementById('order-description');
    const orderClientSelect = document.getElementById('order-client');
    const orderDeadlineInput = document.getElementById('order-deadline');
    const orderChecklistContainer = document.getElementById('order-checklist');
    const orderNotesInput = document.getElementById('order-notes');
    const orderTotalValueInput = document.getElementById('order-total-value');
    const orderAmountPaidInput = document.getElementById('order-amount-paid');
    const orderIsPaidCheckbox = document.getElementById('order-is-paid');
    const cuttingDetailsSection = document.getElementById('cutting-details-section');
    const cuttingSubtasksContainer = document.getElementById('cutting-subtasks-container');
    const addCuttingItemBtn = document.getElementById('add-cutting-item-btn');

    const tasksContainer = document.getElementById('tasks-container');
    const cuttingTasksContainer = document.getElementById('cutting-tasks-container');
    const cuttingModal = document.getElementById('cutting-modal');
    const cuttingModalTitle = document.getElementById('cutting-modal-title');
    const closeCuttingModalBtn = document.getElementById('close-cutting-modal-btn');
    const cuttingChecklistContainer = document.getElementById('cutting-checklist-container');
    const saveCutsBtn = document.getElementById('save-cuts-btn');
    const orderPrintTypeSelect = document.getElementById('order-print-type');
    const orderColorsContainer = document.getElementById('order-colors-container');
    const addColorBtn = document.getElementById('add-color-btn');

    // printing UI / notes / conditional block
    const orderPrintingBlock = document.getElementById('order-printing-block');
    const orderDtfImageInput = document.getElementById('order-dtf-image-input');
    const orderAddDtfImageBtn = document.getElementById('order-add-dtf-image-btn');
    const orderPrintingImagesContainer = document.getElementById('order-printing-images');
    const orderPrintQuantityInput = document.getElementById('order-print-quantity');
    const orderPrintingNotesInput = document.getElementById('order-printing-notes');
    const checkAllDtfImagesBtn = document.getElementById('check-all-dtf-images-btn');
    const clearDtfImagesBtn = document.getElementById('clear-dtf-images-btn');
    let activeDtfImages = []; // temp storage while modal is open
    // toggle visibility of DTF block based on select
    const togglePrintingBlock = () => {
        if (!orderPrintingBlock || !orderPrintTypeSelect) return;
        if (orderPrintTypeSelect.value === 'dtf') orderPrintingBlock.classList.remove('hidden');
        else orderPrintingBlock.classList.add('hidden');
    };
    // attach change handler so block appears when user selects DTF
    if (orderPrintTypeSelect) orderPrintTypeSelect.addEventListener('change', togglePrintingBlock);
    // make sure block reflects initial state
    togglePrintingBlock();

    const artTasksContainer = document.getElementById('art-tasks-container');
    const artModal = document.getElementById('art-modal');
    const artModalTitle = document.getElementById('art-modal-title');
    const closeArtModalBtn = document.getElementById('close-art-modal-btn');
    const artBriefingInput = document.getElementById('art-briefing');
    const artReferencesContainer = document.getElementById('art-references-container');
    const addArtImageBtn = document.getElementById('add-art-image-btn');
    const artImageInput = document.getElementById('art-image-input');
    const saveArtBtn = document.getElementById('save-art-btn');

    let productionOrders = JSON.parse(localStorage.getItem('production_orders')) || [];
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    let editingOrderId = null;
    let activeCuttingOrderId = null;
    let activeArtOrderId = null;



    const checklistItems = { art: "Arte/Design Aprovado", mockup: "Mockup Aprovado", fabric: "Malha/Tecido Comprado", cutting: "Corte Realizado", sewing: "Costura Realizada", printing: "Estampa/Bordado Realizado", finishing: "Acabamento e Embalagem" };
    const sizeOptions = { adulto: ['PP', 'P', 'M', 'G', 'GG', 'EXG', 'G1', 'G2'], infantil: ['1 a 2 anos', '3 a 4 anos', '5 a 6 anos', '7 a 8 anos', '9 a 10 anos'] };
    const categoryIcons = {
        art: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>`,
        mockup: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`,
        fabric: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`,
        cutting: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121M12 12l2.879 2.879M12 12L9.121 14.879M12 12L14.879 9.121M4 4h.01M4 10h.01M4 16h.01M10 4h.01M16 4h.01M10 10h.01M10 16h.01M16 10h.01M16 16h.01" /></svg>`,
        sewing: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1V2M8 7l2 1M8 7l2-1M8 7V4.5M12 21.5v-2.5M12 12v2.5m0 0l2 1m-2-1l-2 1m2-1v4.5M6 14l2-1m2 1l2-1m-2 1v2.5m-8 0l2 1m-2-1l2-1m-2 1v-2.5m14-2.5l2 1m-2-1l2-1m-2 1V14" /></svg>`,
        printing: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>`,
        finishing: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l-3 3m6 0l-3 3M11 3l3 3m0 6l3 3m-6 0l3 3m-3-3l-3 3m6-6l-3 3" /></svg>`
    };

    const saveOrders = () => localStorage.setItem('production_orders', JSON.stringify(productionOrders));
    const formatCurrency = (amount) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleTabClick = (activeTab, activeView) => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active-tab'));
        document.querySelectorAll('.view-container').forEach(view => view.classList.add('hidden'));
        activeTab.classList.add('active-tab');
        activeView.classList.remove('hidden');
    };
    tabQuadro.addEventListener('click', () => handleTabClick(tabQuadro, viewQuadro));
    tabAfazeres.addEventListener('click', () => { handleTabClick(tabAfazeres, viewAfazeres); renderTasks(); });
    tabCortes.addEventListener('click', () => { handleTabClick(tabCortes, viewCortes); renderCuttingTasks(); });

    const populateClientSelect = () => {
        clients = JSON.parse(localStorage.getItem('clients')) || [];
        orderClientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            orderClientSelect.appendChild(option);
        });
    };

    const renderChecklist = (checklistData = {}) => {
        orderChecklistContainer.innerHTML = '';
        for (const key in checklistItems) {
            const task = checklistData[key] || { completed: false, deadline: '' };
            const isDisabled = key === 'cutting' ? 'disabled' : '';
            const itemHtml = `<div class="flex items-center gap-3 bg-white/5 p-2 rounded-md hover:bg-white/10"><input type="checkbox" data-key="${key}" class="checklist-item-status w-5 h-5 rounded text-cyan-500" ${task.completed ? 'checked' : ''} ${isDisabled}><label class="flex-1 text-white">${checklistItems[key]}</label><input type="date" data-key="${key}" value="${task.deadline || ''}" class="checklist-item-deadline bg-white/10 p-1 rounded-md text-xs"></div>`;
            orderChecklistContainer.innerHTML += itemHtml;
        }
    };

    const openModal = (orderId = null) => {
        editingOrderId = orderId;
        populateClientSelect();
        orderForm.reset();
        cuttingSubtasksContainer.innerHTML = '';
        cuttingDetailsSection.classList.remove('hidden');
        // reset DTF temp
        activeDtfImages = [];
        if (orderPrintingImagesContainer) orderPrintingImagesContainer.innerHTML = '';
        if (orderPrintQuantityInput) orderPrintQuantityInput.value = '';

        if (orderId) {
            const order = productionOrders.find(o => o.id === orderId);
            orderModalTitle.textContent = "Editar Pedido";
            orderDescriptionInput.value = order.description;
            orderClientSelect.value = order.clientId;
            orderDeadlineInput.value = order.deadline;
            orderNotesInput.value = order.notes || '';
            orderTotalValueInput.value = order.totalValue || '';
            orderAmountPaidInput.value = order.amountPaid || '';
            orderIsPaidCheckbox.checked = order.isPaid || false;
            renderChecklist(order.checklist);

            const cuttingTask = order.checklist && order.checklist.cutting;
            if (cuttingTask && cuttingTask.subtasks) {
                cuttingTask.subtasks.forEach(sub => renderCuttingSubtask(sub));
            }
            orderPrintTypeSelect.value = order.printType || 'dtf';
            renderColors(order.colors || []);
            // load printing data if present
            if (order.printing && Array.isArray(order.printing.images)) {
                activeDtfImages = order.printing.images.slice();
                renderOrderPrintingPreviews(activeDtfImages);
            }
            if (order.printing && typeof order.printing.total !== 'undefined') {
                orderPrintQuantityInput.value = order.printing.total;
            }
            if (order.printing && typeof order.printing.notes !== 'undefined' && orderPrintingNotesInput) {
                orderPrintingNotesInput.value = order.printing.notes;
            }
            // ensure DTF block visibility
            togglePrintingBlock();
        } else {
            orderModalTitle.textContent = "Novo Pedido de Produção";
            const defaultChecklist = Object.keys(checklistItems).reduce((acc, key) => ({ ...acc, [key]: { completed: false, deadline: '' } }), {});
            renderChecklist(defaultChecklist);
            orderPrintTypeSelect.value = 'dtf';
            renderColors([]);
            activeDtfImages = [];
            if (orderPrintingImagesContainer) orderPrintingImagesContainer.innerHTML = '';
            if (orderPrintQuantityInput) orderPrintQuantityInput.value = '';
            if (orderPrintingNotesInput) orderPrintingNotesInput.value = '';
            togglePrintingBlock();
        }
        orderModal.classList.remove('hidden');
        // Adicione aqui:
        const cancelBtn = document.getElementById('cancel-order-btn');
        if (cancelBtn) {
            cancelBtn.onclick = function (e) {
                e.preventDefault();
                closeModal();
            };
        }
    };

    const closeModal = () => {
        orderModal.classList.add('hidden');
        editingOrderId = null;
    };

    const renderCuttingSubtask = (subtask = {}) => {
        const subtaskId = subtask.id || Date.now() + Math.random();
        const item = document.createElement('div');
        item.className = 'grid grid-cols-12 gap-2 items-center';
        item.dataset.subtaskId = subtaskId;
        const genders = ['Feminina', 'Masculina', 'Infantil'];
        const styles = ['Normal', 'Gola Polo', 'Manga Longa'];
        // compatibilidade: se subtask.type for um estilo antigo, ajusta
        const currentGender = (subtask.type && genders.includes(subtask.type)) ? subtask.type : (subtask.gender || (['Gola Polo','Manga Longa'].includes(subtask.type) ? 'Feminina' : 'Feminina'));
        const currentStyle = (subtask.style) ? subtask.style : (['Gola Polo','Manga Longa'].includes(subtask.type) ? subtask.type : 'Normal');
        const isInfantil = currentGender === 'Infantil';
        const currentSizeList = isInfantil ? sizeOptions.infantil : sizeOptions.adulto;
        item.innerHTML = `
            <div class="col-span-3"><select class="subtask-gender w-full p-1 rounded-md bg-white/10 border-white/20 text-xs">${genders.map(g => `<option ${currentGender === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
            <div class="col-span-4"><select class="subtask-size w-full p-1 rounded-md bg-white/10 border-white/20 text-xs">${currentSizeList.map(s => `<option ${subtask.size === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
            <div class="col-span-3"><select class="subtask-style w-full p-1 rounded-md bg-white/10 border-white/20 text-xs">${styles.map(s => `<option ${currentStyle === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
            <div class="col-span-1"><input type="number" class="subtask-total w-full p-1 rounded-md bg-white/10 border-white/20 text-xs" placeholder="Qtd" value="${subtask.total || ''}"></div>
            <div class="col-span-1"><button type="button" class="remove-subtask-btn text-red-500 hover:text-red-400">×</button></div>
        `;
        cuttingSubtasksContainer.appendChild(item);
    };

    cuttingSubtasksContainer.addEventListener('change', (e) => {
        // atualiza lista de tamanhos quando trocar gênero (Feminina/Masculina/Infantil)
        if (e.target.classList.contains('subtask-gender')) {
            const selectedType = e.target.value;
            const sizeSelect = e.target.closest('.grid').querySelector('.subtask-size');
            const newSizeList = selectedType === 'Infantil' ? sizeOptions.infantil : sizeOptions.adulto;
            sizeSelect.innerHTML = newSizeList.map(s => `<option>${s}</option>`).join('');
        }
    });

    cuttingSubtasksContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-subtask-btn')) {
            e.target.closest('.grid').remove();
        }
    });

    addCuttingItemBtn.addEventListener('click', () => renderCuttingSubtask());

    if (orderForm) {
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const checklist = {};
            document.querySelectorAll('.checklist-item-status').forEach(item => {
                const key = item.dataset.key;
                const deadlineInput = document.querySelector(`.checklist-item-deadline[data-key="${key}"]`);
                checklist[key] = { completed: item.checked, deadline: deadlineInput.value || null };
            });

            const subtasks = [];
            cuttingSubtasksContainer.querySelectorAll('.grid').forEach(row => {
                const totalInput = row.querySelector('.subtask-total');
                if (totalInput && totalInput.value) {
                    const existingSubtask = (editingOrderId && productionOrders.find(o => o.id === editingOrderId).checklist.cutting.subtasks.find(s => s.id == row.dataset.subtaskId));
                    subtasks.push({
                        id: parseFloat(row.dataset.subtaskId) || Date.now() + Math.random(),
                        type: row.querySelector('.subtask-gender') ? row.querySelector('.subtask-gender').value : (row.querySelector('.subtask-type') ? row.querySelector('.subtask-type').value : 'Feminina'),
                        style: row.querySelector('.subtask-style') ? row.querySelector('.subtask-style').value : (existingSubtask ? existingSubtask.style : 'Normal'),
                        size: row.querySelector('.subtask-size').value,
                        total: parseInt(totalInput.value) || 0,
                        cut: existingSubtask ? existingSubtask.cut : 0
                    });
                }
            });

            checklist.cutting = checklist.cutting || {};
            checklist.cutting.completed = subtasks.length === 0;
            checklist.cutting.subtasks = subtasks;

            // coleta cores dos inputs reais (hex text inputs ou compatíveis)
            const colors = orderColorsContainer
                ? Array.from(orderColorsContainer.querySelectorAll('.color-hex, .color-input'))
                      .map(i => (i.value || '').trim())
                      .filter(v => v)
                : [];

            const orderData = {
                description: orderDescriptionInput.value,
                clientId: parseInt(orderClientSelect.value) || null,
                deadline: orderDeadlineInput.value,
                checklist: checklist,
                notes: orderNotesInput.value.trim(),
                totalValue: parseFloat(orderTotalValueInput.value) || 0,
                amountPaid: parseFloat(orderAmountPaidInput.value) || 0,
                isPaid: orderIsPaidCheckbox.checked,
                printType: orderPrintTypeSelect ? orderPrintTypeSelect.value : 'dtf',
                // shirtType removido conforme solicitado
                colors: colors,
                printing: {
                    images: activeDtfImages.slice(),
                    total: parseInt(orderPrintQuantityInput?.value) || (checklist.printing && checklist.printing.total ? parseInt(checklist.printing.total) : 0),
                    notes: orderPrintingNotesInput ? (orderPrintingNotesInput.value || '').trim() : ''
                }
            };
            if (editingOrderId) {
                const orderIndex = productionOrders.findIndex(o => o.id === editingOrderId);
                productionOrders[orderIndex] = { ...productionOrders[orderIndex], ...orderData };
            } else {
                const newOrder = { id: Date.now(), status: 'todo', ...orderData };
                productionOrders.push(newOrder);
            }
            saveOrders();
            renderKanban();
            closeModal();
        });
    }

    const createOrderCard = (order) => {
        const client = clients.find(c => c.id === order.clientId);
        const card = document.createElement('div');
        card.className = 'kanban-card bg-gray-800 p-3 rounded-lg border border-white/10 shadow-lg cursor-pointer hover:border-cyan-400 relative';
        card.setAttribute('draggable', true);
        card.dataset.id = order.id;

        // CORREÇÃO DO BUG DE DATA
        const deadline = new Date(order.deadline + "T03:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = deadline - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        let deadlineColor = 'text-gray-400';
        let deadlineText = `Vence em ${diffDays} dias`;
        if (diffDays < 0) { deadlineColor = 'text-red-500 font-bold'; deadlineText = `Atrasado há ${Math.abs(diffDays)} dias`; }
        else if (diffDays === 0) { deadlineColor = 'text-red-500 font-bold animate-pulse'; deadlineText = "Vence Hoje!"; }
        else if (diffDays === 1) { deadlineColor = 'text-yellow-400 font-semibold'; deadlineText = "Vence Amanhã!"; }
        else if (diffDays <= 3) { deadlineColor = 'text-yellow-400 font-semibold'; }

        const totalTasks = order.checklist ? Object.keys(order.checklist).length : 0;
        const completedTasks = order.checklist ? Object.values(order.checklist).filter(task => task.completed).length : 0;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        let deleteButtonHTML = '';
        if (order.status === 'done') {
            deleteButtonHTML = `<button onclick="window.removeOrder(${order.id})" class="absolute top-2 right-2 text-gray-500 hover:text-red-400" title="Excluir Pedido Concluído"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button>`;
        }

        let noteIconHTML = '';
        if (order.notes) { noteIconHTML = `<div class="absolute top-2 left-3 text-gray-500" title="${order.notes}">🗒️</div>`; }

        let paymentStatusHTML = '';
        const total = order.totalValue || 0;
        const paid = order.amountPaid || 0;
        if (order.isPaid && total > 0) {
            if (paid >= total) {
                paymentStatusHTML = `<div class="text-xs font-bold text-green-400">${formatCurrency(paid)} / ${formatCurrency(total)}</div>`;
            } else if (paid > 0) {
                paymentStatusHTML = `<div class="text-xs font-bold text-yellow-400">${formatCurrency(paid)} / ${formatCurrency(total)}</div>`;
            }
        }

        card.innerHTML = `
            ${deleteButtonHTML}
            ${noteIconHTML}
            <div onclick="window.openOrderModal(${order.id})">
                <p class="font-bold pr-6">${order.description}</p>
                <p class="text-sm text-gray-400 mb-2">Cliente: <span class="font-semibold text-cyan-300">${client ? client.name : 'Não encontrado'}</span></p>
                <div class="w-full bg-white/10 rounded-full h-2 mb-2">
                    <div class="bg-cyan-500 h-2 rounded-full" style="width: ${progress}%"></div>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <div class="text-xs">${completedTasks}/${totalTasks} tarefas</div>
                    ${paymentStatusHTML}
                    <div class="text-xs ${deadlineColor}">${deadlineText}</div>
                </div>
            </div>
        `;
        return card;
    };

    window.removeOrder = (orderId) => {
        if (confirm('Tem certeza que deseja excluir permanentemente este pedido concluído?')) {
            productionOrders = productionOrders.filter(o => o.id !== orderId);
            saveOrders();
            renderKanban();
        }
    };

    window.openOrderModal = (orderId) => openModal(orderId);

    const renderKanban = () => {
        Object.values(columns).forEach(col => col.innerHTML = '');
        productionOrders.forEach(order => {
            if (columns[order.status]) {
                const card = createOrderCard(order);
                columns[order.status].appendChild(card);
            }
        });
    };

    const kanbanColumns = document.querySelectorAll('.kanban-column');
    kanbanColumns.forEach(column => {
        column.addEventListener('dragover', e => { e.preventDefault(); column.classList.add('bg-white/5'); });
        column.addEventListener('dragleave', () => { column.classList.remove('bg-white/5'); });
        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('bg-white/5');
            const cardId = parseInt(e.dataTransfer.getData('text/plain'));
            const newStatus = column.id.replace('column-', '');
            const order = productionOrders.find(o => o.id === cardId);
            if (order) {
                order.status = newStatus;
                saveOrders();
                renderKanban();
            }
        });
    });

    document.addEventListener('dragstart', e => {
        if (e.target.classList.contains('kanban-card')) {
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
        }
    });

    // Duplicate checkPrefillData function removed to fix redeclaration error.

    const renderTasks = () => {
        tasksContainer.innerHTML = '';
        const allTasks = [];
        productionOrders.forEach(order => {
            if (order.status !== 'done' && order.checklist) {
                for (const key in order.checklist) {
                    if (checklistItems[key]) {
                        const task = order.checklist[key];
                        if (!task.completed && task.deadline) {
                            allTasks.push({ orderId: order.id, taskKey: key, description: order.description, clientId: order.clientId, taskName: checklistItems[key], deadline: task.deadline });
                        }
                    }
                }
            }
        });
        const groupedTasks = allTasks.reduce((acc, task) => {
            const groupName = task.taskName;
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(task);
            return acc;
        }, {});
        if (allTasks.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'glass-card p-6 text-center text-gray-400 md:col-span-2 xl:col-span-3';
            emptyState.innerHTML = 'Nenhuma tarefa com prazo definido encontrada. ✨';
            tasksContainer.appendChild(emptyState);
            return;
        }
        for (const groupKey in checklistItems) {
            const groupName = checklistItems[groupKey];
            if (groupedTasks[groupName]) {
                const tasks = groupedTasks[groupName];
                const card = document.createElement('div');
                card.className = 'glass-card p-4 flex flex-col';
                let tasksHTML = tasks.map(task => {
                    const client = clients.find(c => c.id === task.clientId);
                    return `<div class="flex items-center justify-between p-3 border-l-4 border-cyan-500/50 bg-white/5 rounded-r-md"><label class="flex items-center gap-3 cursor-pointer"><input type="checkbox" data-order-id="${task.orderId}" data-task-key="${task.taskKey}" class="task-checkbox w-5 h-5 rounded text-cyan-500 bg-gray-700 border-gray-600 focus:ring-cyan-600"><div><p class="font-semibold text-sm">${task.description}</p><p class="text-xs text-cyan-300">${client ? client.name : 'Cliente não encontrado'}</p></div></label><span class="text-sm text-gray-400">Prazo: ${new Date(task.deadline + 'T03:00:00').toLocaleDateString('pt-BR')}</span></div>`;
                }).join('');
                card.innerHTML = `<div class="flex items-center justify-between mb-4"><div class="flex items-center gap-3 text-cyan-300">${categoryIcons[groupKey]}<h2 class="text-lg font-bold">${groupName}</h2></div><span class="task-badge">${tasks.length}</span></div><div class="space-y-3">${tasksHTML}</div>`;
                tasksContainer.appendChild(card);
            }
        }
    };

    if (tasksContainer) {
        tasksContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const checkbox = e.target;
                const orderId = parseInt(checkbox.dataset.orderId);
                const taskKey = checkbox.dataset.taskKey;
                const order = productionOrders.find(o => o.id === orderId);
                if (order && order.checklist[taskKey]) {
                    order.checklist[taskKey].completed = checkbox.checked;
                    saveOrders();
                    renderTasks();
                }
            }
        });
    }

    const renderCuttingTasks = () => {
        cuttingTasksContainer.innerHTML = '';
        const pendingCutOrders = productionOrders.filter(order => order.checklist && order.checklist.cutting && !order.checklist.cutting.completed && order.checklist.cutting.subtasks && order.checklist.cutting.subtasks.length > 0);
        if (pendingCutOrders.length === 0) {
            cuttingTasksContainer.innerHTML = '<div class="glass-card p-6 text-center text-gray-400">Nenhuma tarefa de corte pendente. ✨</div>';
            return;
        }
        pendingCutOrders.forEach(order => {
            const client = clients.find(c => c.id === order.clientId);
            const totalToCut = order.checklist.cutting.subtasks.reduce((acc, sub) => acc + sub.total, 0);
            const totalCut = order.checklist.cutting.subtasks.reduce((acc, sub) => acc + sub.cut, 0);

            // render colors as small cards (works with names or hex; if CMYK string it will show text)
            const colors = order.colors || [];
            const colorsHtml = colors.map(c => {
                // try to use as background if looks like hex, otherwise show label
                const safeBg = /^#([0-9A-F]{3}){1,2}$/i.test(c.trim()) ? `background:${c}` : '';
                return `<div class="flex items-center gap-2"><div class="w-6 h-6 rounded-sm border" style="${safeBg}"></div><span class="text-xs text-gray-300">${c}</span></div>`;
            }).join('');

            const card = document.createElement('div');
            card.className = 'glass-card p-4 flex flex-col gap-3';
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="font-bold">${order.description}</p>
                        <p class="text-sm text-cyan-300">${client ? client.name : 'Cliente'}</p>
                        <p class="text-xs text-gray-400">Prazo: ${order.deadline ? new Date(order.deadline + "T03:00:00").toLocaleDateString('pt-BR') : ''}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold">${totalCut} / ${totalToCut}</p>
                        <p class="text-xs text-gray-400">Peças Cortadas</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-3 items-center">
                    ${colorsHtml || '<span class="text-xs text-gray-500">Sem cores definidas</span>'}
                </div>
                <div class="flex justify-end">
                    <button data-order-id="${order.id}" class="open-checklist-btn btn-shine py-2 px-4 rounded-lg text-sm">Abrir Checklist</button>
                </div>
            `;
            cuttingTasksContainer.appendChild(card);
        });
    };

    if (cuttingTasksContainer) {
        cuttingTasksContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('open-checklist-btn')) {
                openCuttingModal(parseInt(e.target.dataset.orderId));
            }
        });
    }

    const openCuttingModal = (orderId) => {
        activeCuttingOrderId = orderId;
        const order = productionOrders.find(o => o.id === orderId);
        const client = clients.find(c => c.id === order.clientId);
        cuttingModalTitle.textContent = `Pedido: ${order.description} (${client.name})`;

        // remove existing details display (avoid duplicates)
        const existingDetails = document.getElementById('cutting-details-display');
        if (existingDetails) existingDetails.remove();

        // build details card with colors and insert above checklist (tipo de camisa removido)
        const colors = order.colors || [];
        const colorsHtml = colors.map(c => {
            const safeBg = /^#([0-9A-F]{3}){1,2}$/i.test((c || '').trim()) ? `background:${c}` : '';
            return `<div class="flex items-center gap-2"><div class="w-6 h-6 rounded-sm border" style="${safeBg}"></div><span class="text-xs text-gray-300">${c}</span></div>`;
        }).join('');
        const detailsHtml = `
            <div id="cutting-details-display" class="glass-card p-4 mb-4">
                <div>
                    <p class="text-sm text-gray-300">Cores</p>
                    <div class="flex gap-3 mt-2 flex-wrap">
                        ${colorsHtml || '<span class="text-xs text-gray-500">Sem cores</span>'}
                    </div>
                </div>
            </div>
        `;
        if (cuttingChecklistContainer && cuttingChecklistContainer.parentElement) {
            cuttingChecklistContainer.insertAdjacentHTML('beforebegin', detailsHtml);
        }

        renderCuttingChecklist(order.checklist.cutting.subtasks);
        cuttingModal.classList.remove('hidden');
        const closeBtn = document.getElementById('close-cutting-modal-btn');
        if (closeBtn) {
            closeBtn.onclick = function (e) {
                e.preventDefault();
                closeCuttingModal();
            };
        }
    };

    const renderCuttingChecklist = (subtasks) => {
        cuttingChecklistContainer.innerHTML = '';
        subtasks.forEach(subtask => {
            const isCompleted = subtask.cut >= subtask.total;
            const label = `${subtask.type || ''}${subtask.style && subtask.style !== 'Normal' ? ' (' + subtask.style + ')' : ''} - ${subtask.size}`;
            const item = document.createElement('div');
            item.className = `p-3 rounded-md flex justify-between items-center bg-white/5 ${isCompleted ? 'border-l-4 border-green-500' : ''}`;
            item.innerHTML = `<div class="font-semibold">${label}</div><div class="flex items-center gap-4"><input type="number" value="${subtask.cut}" min="0" max="${subtask.total}" class="cut-quantity-input w-20 p-2 text-center rounded-md bg-white/10" data-subtask-id="${subtask.id}"><span class="text-gray-400">/ ${subtask.total}</span></div>`;
            cuttingChecklistContainer.appendChild(item);
        });
    };

    const saveCuts = () => {
        const order = productionOrders.find(o => o.id === activeCuttingOrderId);
        if (!order) return;
        let allSubtasksCompleted = true;
        document.querySelectorAll('.cut-quantity-input').forEach(input => {
            const subtaskId = parseFloat(input.dataset.subtaskId);
            const newCutAmount = parseInt(input.value);
            const subtask = order.checklist.cutting.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.cut = newCutAmount;
                if (subtask.cut < subtask.total) allSubtasksCompleted = false;
            }
        });
        if (allSubtasksCompleted) {
            if (confirm("Todos os itens foram cortados. Deseja marcar a tarefa de corte como concluída?")) {
                order.checklist.cutting.completed = true;
            }
        }
        saveOrders();
        closeCuttingModal();
        renderCuttingTasks();
        renderKanban();
    };

    const closeCuttingModal = () => {
        cuttingModal.classList.add('hidden');
        activeCuttingOrderId = null;
    };

    const renderArtTasks = () => {
        artTasksContainer.innerHTML = '';
        const ordersWithArt = productionOrders.filter(order => {
            // Só mostra pedidos onde a checklist de arte NÃO está marcada como concluída
            return order.status !== 'done' && (!order.checklist?.art?.completed);
        });
        if (ordersWithArt.length === 0) {
            artTasksContainer.innerHTML = '<div class="glass-card p-6 text-center text-gray-400">Nenhum pedido pendente para arte. ✨</div>';
            return;
        }
        ordersWithArt.forEach(order => {
            const client = clients.find(c => c.id === order.clientId);
            const artData = order.art || {};
            const deadline = artData.deadline || order.deadline;
            let deadlineText = '';
            if (deadline) {
                const deadlineDate = new Date(deadline + "T03:00:00");
                deadlineText = `Prazo: ${deadlineDate.toLocaleDateString('pt-BR')}`;
            }
            const card = document.createElement('div');
            card.className = 'glass-card p-4 flex justify-between items-center';
            card.innerHTML = `
                <div>
                    <p class="font-bold">${order.description}</p>
                    <p class="text-sm text-cyan-300">${client ? client.name : 'Cliente'}</p>
                    <p class="text-xs text-gray-400">${deadlineText}</p>
                </div>
                <button data-order-id="${order.id}" class="open-art-modal-btn btn-shine py-2 px-4 rounded-lg text-sm">Abrir Arte</button>
            `;
            artTasksContainer.appendChild(card);
        });
    };

    const openArtModal = (orderId) => {
        activeArtOrderId = orderId;
        const order = productionOrders.find(o => o.id === orderId);
        const client = clients.find(c => c.id === order.clientId);
        artModalTitle.textContent = `Arte: ${order.description} (${client ? client.name : ''})`;
        artBriefingInput.value = (order.art && order.art.briefing) || '';
        artReferencesContainer.innerHTML = '';
        if (order.art && order.art.images) {
            order.art.images.forEach((img, idx) => {
                const imgDiv = document.createElement('div');
                imgDiv.className = 'relative';
                imgDiv.innerHTML = `<img src="${img}" class="rounded shadow w-full h-24 object-cover"/><button type="button" class="remove-art-image absolute top-1 right-1 bg-black/60 text-white rounded-full px-2" data-idx="${idx}">&times;</button>`;
                artReferencesContainer.appendChild(imgDiv);
            });
        }
        artModal.classList.remove('hidden');
    };

    const saveArtData = () => {
        const order = productionOrders.find(o => o.id === activeArtOrderId);
        if (!order) return;
        order.art = order.art || {};
        order.art.briefing = artBriefingInput.value;
        order.art.images = order.art.images || [];
        order.art.deadline = order.deadline; // Usa o prazo do pedido, pode adicionar campo separado se quiser
        saveOrders();
        artModal.classList.add('hidden');
        activeArtOrderId = null;
        renderArtTasks();
    };

    addArtImageBtn.addEventListener('click', () => artImageInput.click());
    artImageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const order = productionOrders.find(o => o.id === activeArtOrderId);
        if (!order) return;
        order.art = order.art || {};
        order.art.images = order.art.images || [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                order.art.images.push(ev.target.result);
                renderArtReferences(order.art.images);
            };
            reader.readAsDataURL(file);
        });
        saveOrders();
        artImageInput.value = '';
    });


    artReferencesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-art-image')) {
            const idx = parseInt(e.target.dataset.idx);
            const order = productionOrders.find(o => o.id === activeArtOrderId);
            if (order && order.art && order.art.images) {
                order.art.images.splice(idx, 1);
                renderArtReferences(order.art.images);
                saveOrders();
            }
        }
    });

    if (artTasksContainer) {
        artTasksContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('open-art-modal-btn')) {
                openArtModal(parseInt(e.target.dataset.orderId));
            }
        });
    }
    if (closeArtModalBtn) closeArtModalBtn.addEventListener('click', () => artModal.classList.add('hidden'));
    if (saveArtBtn) saveArtBtn.addEventListener('click', saveArtData);

    // Ativa renderização da aba de artes
    const tabArtes = document.getElementById('tab-artes');
    const viewArtes = document.getElementById('view-artes');
    tabArtes.addEventListener('click', () => { handleTabClick(tabArtes, viewArtes); renderArtTasks(); });

    const checkPrefillData = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'new_order') {
            const prefillData = JSON.parse(localStorage.getItem('prefill_order_form'));
            if (prefillData) {
                openModal();
                orderDescriptionInput.value = prefillData.description;
                orderClientSelect.value = prefillData.clientId;
                localStorage.removeItem('prefill_order_form');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    };

    renderKanban();
    checkPrefillData();

    const dtfTasksContainer = document.getElementById('dtf-tasks-container');
    const tabDTF = document.getElementById('tab-dtf');
    const viewDTF = document.getElementById('view-dtf');

    tabDTF.addEventListener('click', () => { handleTabClick(tabDTF, viewDTF); renderDTFTasks(); });

    function renderDTFTasks() {
        dtfTasksContainer.innerHTML = '';
        // filtra pedidos DTF não concluídos (por status e por printing.completed)
        const dtfOrders = productionOrders.filter(order =>
            order.printType === 'dtf' &&
            order.status !== 'done' &&
            !(order.printing && order.printing.completed)
        );
        if (dtfOrders.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'glass-card p-6 text-center text-gray-400';
            empty.textContent = 'Nenhum pedido DTF pendente. ✨';
            dtfTasksContainer.appendChild(empty);
            return;
        }

        dtfOrders.forEach(order => {
            const client = clients.find(c => c.id === order.clientId);
            const deadline = order.deadline ? new Date(order.deadline + "T03:00:00").toLocaleDateString('pt-BR') : '';
            const images = (order.printing && Array.isArray(order.printing.images) && order.printing.images.length) ? order.printing.images : ((order.art && order.art.images) || []);
            const colors = order.colors || [];
            const printQty = (order.printing && order.printing.total) ? order.printing.total : (order.checklist && order.checklist.printing && order.checklist.printing.total) || '';
            const printNotes = (order.printing && order.printing.notes) ? order.printing.notes : '';

            const card = document.createElement('div');
            card.className = 'dtf-card glass-card p-4 flex flex-col gap-3';
            card.style.width = '100%';
            card.style.boxSizing = 'border-box';

            // head
            const head = document.createElement('div');
            head.className = 'flex justify-between items-start gap-2';
            const left = document.createElement('div');
            const title = document.createElement('p'); title.className = 'font-bold text-sm'; title.textContent = order.description;
            const clientP = document.createElement('p'); clientP.className = 'text-xs text-cyan-300'; clientP.textContent = client ? client.name : 'Cliente';
            const deadlineP = document.createElement('p'); deadlineP.className = 'text-2xs text-gray-400'; deadlineP.textContent = `Prazo: ${deadline}`;
            left.appendChild(title);
            left.appendChild(clientP);
            left.appendChild(deadlineP);

            const right = document.createElement('div');
            const tag = document.createElement('span'); tag.className = 'px-2 py-1 rounded bg-cyan-600/20 text-cyan-400 text-xs font-bold'; tag.textContent = 'DTF';
            right.appendChild(tag);

            head.appendChild(left);
            head.appendChild(right);
            card.appendChild(head);

            // printing notes (aparece direto no card)
            if (printNotes && printNotes.trim()) {
                const notesEl = document.createElement('div');
                notesEl.className = 'dtf-notes text-xs text-gray-300';
                notesEl.textContent = `Observações: ${printNotes}`;
                card.appendChild(notesEl);
            }

            // images grid
            if (images && images.length) {
                const imgsWrap = document.createElement('div');
                imgsWrap.className = 'grid grid-cols-2 gap-2';
                images.forEach(src => {
                    const imgWrap = document.createElement('div');
                    imgWrap.className = 'w-full h-28 overflow-hidden rounded';
                    const img = document.createElement('img');
                    img.src = src;
                    img.alt = 'Arte DTF';
                    img.className = 'w-full h-full object-cover';
                    imgWrap.appendChild(img);
                    imgsWrap.appendChild(imgWrap);
                });
                card.appendChild(imgsWrap);
            }

            // colors
            if (colors && colors.length) {
                const colorsWrap = document.createElement('div');
                colorsWrap.className = 'flex gap-2 flex-wrap';
                colors.forEach(c => {
                    const span = document.createElement('span');
                    span.className = 'px-2 py-1 rounded bg-white/10 border border-white/20 text-xs';
                    span.textContent = c;
                    colorsWrap.appendChild(span);
                });
                card.appendChild(colorsWrap);
            }

            // footer: separado checkbox + qty + Pedido Feito button
            const footer = document.createElement('div');
            footer.className = 'flex items-center justify-between gap-2';

            // left side: checkbox "Separado" + qty
            const leftFooter = document.createElement('div');
            leftFooter.className = 'flex items-center gap-3';

            // Separado checkbox
            const separatedId = `dtf-separated-${order.id}`;
            const separatedWrapper = document.createElement('label');
            separatedWrapper.className = 'flex items-center gap-2 text-xs';
            const separatedCheckbox = document.createElement('input');
            separatedCheckbox.type = 'checkbox';
            separatedCheckbox.className = 'dtf-separated-checkbox';
            separatedCheckbox.checked = !!(order.printing && order.printing.separated);
            separatedCheckbox.dataset.orderId = order.id;
            const separatedLabel = document.createElement('span');
            separatedLabel.textContent = 'Separado';
            separatedWrapper.appendChild(separatedCheckbox);
            separatedWrapper.appendChild(separatedLabel);

            // quantity badge
            const qty = document.createElement('span');
            qty.className = 'px-2 py-1 rounded bg-gray-700 text-gray-300 text-xs';
            qty.textContent = `Qtd: ${printQty || ''}`;

            leftFooter.appendChild(separatedWrapper);
            leftFooter.appendChild(qty);

            footer.appendChild(leftFooter);

            // right side: actions (Pedido Feito)
            const actions = document.createElement('div');
            actions.className = 'flex items-center gap-2';

            const doneBtn = document.createElement('button');
            doneBtn.type = 'button';
            doneBtn.className = 'text-xs px-2 py-1 rounded bg-green-600 text-white';
            doneBtn.textContent = 'Pedido Feito';
            doneBtn.title = 'Marcar impressão como concluída e remover do Controle de DTF';
            doneBtn.addEventListener('click', () => {
                if (!confirm('Marcar este DTF como concluído e remover do Controle de DTF?')) return;
                order.printing = order.printing || {};
                order.printing.completed = true;
                // opcional: atualizar status também (comente se não quiser alterar status global)
                // order.status = 'done';
                saveOrders();
                renderDTFTasks();
            });

            actions.appendChild(doneBtn);
            footer.appendChild(actions);

            card.appendChild(footer);

            // handler: toggle separado checkbox
            separatedCheckbox.addEventListener('change', (e) => {
                const oid = parseInt(e.target.dataset.orderId, 10);
                const o = productionOrders.find(x => x.id === oid);
                if (!o) return;
                o.printing = o.printing || {};
                o.printing.separated = !!e.target.checked;
                saveOrders();
                // atualização visual mínima sem recriar tudo
                // (re-render para garantir consistência)
                renderDTFTasks();
            });

            dtfTasksContainer.appendChild(card);
        });
    }

    // render previews for DTF images inside modal (fix: function missing -> define it)
    function renderOrderPrintingPreviews(images = []) {
        if (!orderPrintingImagesContainer) return;
        orderPrintingImagesContainer.innerHTML = '';
        images.forEach((img, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'relative w-24 h-24 rounded overflow-hidden border border-white/10';
            wrap.style.minWidth = '96px';
            wrap.style.minHeight = '96px';
            const imageEl = document.createElement('img');
            imageEl.src = img;
            imageEl.className = 'w-full h-full object-cover';
            imageEl.alt = `Arte DTF ${idx + 1}`;
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'absolute top-1 right-1 bg-black/60 text-white rounded px-1';
            del.innerHTML = '&times;';
            del.title = 'Remover';
            del.addEventListener('click', (e) => {
                e.stopPropagation();
                activeDtfImages.splice(idx, 1);
                renderOrderPrintingPreviews(activeDtfImages);
            });
            wrap.appendChild(imageEl);
            wrap.appendChild(del);
            orderPrintingImagesContainer.appendChild(wrap);
        });
    }

    // DEBUG — lista elementos ausentes
    ['add-order-btn', 'tab-quadro', 'tab-afazeres', 'tab-cortes', 'view-quadro', 'view-afazeres', 'view-cortes', 'order-modal', 'cancel-order-btn', 'close-cutting-modal-btn', 'close-art-modal-btn']
        .forEach(id => {
            if (!document.getElementById(id)) console.warn(`processos.js: elemento ausente no DOM -> #${id}`);
        });

    // Listener delegado para fechar modais mesmo que o botão seja adicionado dinamicamente
    document.addEventListener('click', (e) => {
        const btn = e.target;
        // Fechar modal de pedido
        if (btn.id === 'cancel-order-btn' || btn.closest && btn.closest('[data-action="close-order-modal"]')) {
            e.preventDefault();
            if (orderModal) {
                orderModal.classList.add('hidden');
                console.log('processos.js: orderModal fechado (delegado)');
            }
            editingOrderId = null;
        }
        // Fechar modal de corte
        if (btn.id === 'close-cutting-modal-btn' || btn.closest && btn.closest('[data-action="close-cutting-modal"]')) {
            e.preventDefault();
            const modal = document.getElementById('cutting-modal');
            if (modal) { modal.classList.add('hidden'); console.log('processos.js: cuttingModal fechado (delegado)'); }
            activeCuttingOrderId = null;
        }
        // Fechar modal de arte
        if (btn.id === 'close-art-modal-btn' || btn.closest && btn.closest('[data-action="close-art-modal"]')) {
            e.preventDefault();
            const modal = document.getElementById('art-modal');
            if (modal) { modal.classList.add('hidden'); console.log('processos.js: artModal fechado (delegado)'); }
            activeArtOrderId = null;
        }
    });

    // Registrar erros JS visíveis no console para diagnóstico rápido
    window.addEventListener('error', (ev) => {
        console.error('processos.js - erro detectado:', ev.message, 'em', ev.filename, 'linha', ev.lineno);
    });

    // Diagnóstico e correção temporária de overlays que cobrem a tela
    (function detectAndFixOverlays() {
        const modalIds = ['order-modal', 'cutting-modal', 'art-modal', 'art-image-fullscreen-modal'];
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // lista elementos fullscreen visíveis que podem estar cobrindo a tela
        const candidates = Array.from(document.body.querySelectorAll('*')).filter(el => {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return false;
            const r = el.getBoundingClientRect();
            // cobrir quase toda a viewport ou posicionamento fixed/full
            return (r.width >= vw - 2 && r.height >= vh - 2) || (cs.position === 'fixed' && r.top <= 0 && r.left <= 0 && r.bottom >= vh && r.right >= vw);
        });

        if (candidates.length) {
            console.warn('processos.js: possíveis overlays fullscreen encontrados:', candidates);
            candidates.forEach(el => {
                const z = getComputedStyle(el).zIndex || 'auto';
                console.warn(' ->', el.tagName, el.id || el.className, 'zIndex=', z);
            });
        } else {
            console.log('processos.js: nenhum overlay fullscreen detectado automaticamente.');
        }

        // Auto-fix: desativa pointer-events em overlays que NÃO são os modais conhecidos
        candidates.forEach(el => {
            if (!modalIds.includes(el.id)) {
                // marcar para restaurar se necessário
                if (!el.dataset._overlayPatched) {
                    el.dataset._overlayPatched = '1';
                    el._oldPointerEvents = el.style.pointerEvents || '';
                    el.style.pointerEvents = 'none';
                    el.style.userSelect = 'auto';
                    console.warn('processos.js: pointer-events disabled em', el);
                }
            } else {
                // garante que modais estejam acima e recebam eventos
                el.style.zIndex = '99999';
                el.style.pointerEvents = 'auto';
            }
        });

        // helper para depurar cliques: mostra elemento que recebe o clique
        document.addEventListener('click', (ev) => {
            const top = document.elementFromPoint(ev.clientX, ev.clientY);
            if (top) {
                console.log('processos.js: elemento no ponto do clique ->', top.tagName, top.id || top.className);
            }
        }, { capture: true });

        // Expor função para restaurar overlays (usar no console se precisar)
        window.__restoreOverlays = () => {
            document.querySelectorAll('[data-_overlayPatched="1"]').forEach(el => {
                el.style.pointerEvents = el._oldPointerEvents || '';
                delete el.dataset._overlayPatched;
                delete el._oldPointerEvents;
                console.log('processos.js: restaurado pointer-events em', el);
            });
        };
    })();

    // Helpers de cor
    const isHex = (v) => /^#([0-9A-F]{3}){1,2}$/i.test((v || '').trim());
    const hexToRgb = (hex) => {
        if (!hex) return null;
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(h => h + h).join('');
        const int = parseInt(hex, 16);
        return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
    };
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    const rgbToCmyk = (r, g, b) => {
        if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
        const rn = r / 255, gn = g / 255, bn = b / 255;
        const k = 1 - Math.max(rn, gn, bn);
        const c = Math.round(((1 - rn - k) / (1 - k)) * 100);
        const m = Math.round(((1 - gn - k) / (1 - k)) * 100);
        const y = Math.round(((1 - bn - k) / (1 - k)) * 100);
        return { c: Math.max(0, c), m: Math.max(0, m), y: Math.max(0, y), k: Math.round(k * 100) };
    };
    const formatCMYK = (cmyk) => `C:${cmyk.c}% M:${cmyk.m}% Y:${cmyk.y}% K:${cmyk.k}%`;

    // Renderizador avançado de cores (swatch + colorpicker + hex + CMYK + eyedropper)
    function renderColors(colors = []) {
        if (!orderColorsContainer) return;
        orderColorsContainer.innerHTML = '';
        colors.forEach((color, idx) => {
            const safeColor = color && typeof color === 'string' ? color.trim() : '';
            const hex = isHex(color) ? color.toUpperCase() : (isHex(safeColor) ? safeColor.toUpperCase() : '');
            const rgb = hex ? hexToRgb(hex) : { r: 0, g: 0, b: 0 };
            const cmyk = hex ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 100 };
            const colorHtml = `
            <div class="color-entry flex items-center gap-2 mb-2" data-idx="${idx}">
                <div class="color-swatch w-10 h-10 rounded border" style="background:${hex || 'transparent'};min-width:40px;min-height:40px"></div>
                <input type="color" class="color-picker w-10 h-10 p-0 border-0" value="${hex || '#000000'}" title="Abrir seletor de cor">
                <input type="text" class="color-hex p-1 rounded bg-white/10 border border-white/20 text-xs w-28" value="${hex || ''}" placeholder="#RRGGBB">
                <button type="button" class="eye-dropper-btn px-2 py-1 rounded bg-white/5 text-xs" title="Eyedropper">${window.EyeDropper ? '🎯' : '🔍'}</button>
                <div class="cmyk text-xs text-gray-300 ml-2">${hex ? formatCMYK(cmyk) : 'CMYK N/A'}</div>
                <button type="button" class="remove-color-btn text-red-500 hover:text-red-400 ml-4 px-2 py-1 rounded" data-idx="${idx}">×</button>
            </div>
        `;
            orderColorsContainer.insertAdjacentHTML('beforeend', colorHtml);
        });
    }

    // +Cor: cria nova cor padrão
    if (addColorBtn) {
        addColorBtn.addEventListener('click', () => {
            const current = Array.from(orderColorsContainer.querySelectorAll('.color-hex')).map(i => i.value);
            // adiciona um placeholder hex para facilitar escolha
            renderColors([...current, '#000000']);
        });
    }

    // Delegate para interações dentro do container de cores
    if (orderColorsContainer) {
        // click (remove, eyedropper)
        orderColorsContainer.addEventListener('click', async (e) => {
            const target = e.target;
            // remover cor
            if (target.classList.contains('remove-color-btn')) {
                const idx = parseInt(target.dataset.idx, 10);
                const colors = Array.from(orderColorsContainer.querySelectorAll('.color-hex')).map(i => i.value);
                colors.splice(idx, 1);
                renderColors(colors);
                return;
            }

            // eyedropper (usa API se disponível)
            if (target.classList.contains('eye-dropper-btn')) {
                const entry = target.closest('.color-entry');
                if (!entry) return;
                const hexInput = entry.querySelector('.color-hex');
                const colorPicker = entry.querySelector('.color-picker');

                if (window.EyeDropper) {
                    try {
                        const eye = new EyeDropper();
                        const result = await eye.open();
                        if (result && result.sRGBHex) {
                            const picked = result.sRGBHex.toUpperCase();
                            if (hexInput) hexInput.value = picked;
                            if (colorPicker) colorPicker.value = picked;
                            // update swatch + CMYK
                            const sw = entry.querySelector('.color-swatch');
                            if (sw) sw.style.background = picked;
                            const cmykEl = entry.querySelector('.cmyk');
                            if (cmykEl) {
                                const rgb = hexToRgb(picked);
                                const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 100 };
                                cmykEl.textContent = formatCMYK(cmyk);
                            }
                        }
                    } catch (err) {
                        console.warn('Eyedropper canceled/failed', err);
                        alert('Eyedropper cancelado ou não suportado neste contexto.');
                    }
                } else {
                    alert('EyeDropper API não disponível no seu navegador.');
                }
                return;
            }
        });

        // input (color picker or hex text changes) - delegação
        orderColorsContainer.addEventListener('input', (e) => {
            const target = e.target;
            const entry = target.closest('.color-entry');
            if (!entry) return;

            const sw = entry.querySelector('.color-swatch');
            const colorPicker = entry.querySelector('.color-picker');
            const hexInput = entry.querySelector('.color-hex');
            const cmykEl = entry.querySelector('.cmyk');

            if (target.classList.contains('color-picker')) {
                // sync picker -> hex
                const v = (target.value || '').toUpperCase();
                if (hexInput) hexInput.value = v;
                if (sw) sw.style.background = v;
                if (cmykEl) {
                    const rgb = hexToRgb(v);
                    const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 100 };
                    cmykEl.textContent = formatCMYK(cmyk);
                }
            }

            if (target.classList.contains('color-hex')) {
                let v = (target.value || '').trim();
                if (v && !v.startsWith('#')) v = '#' + v;
                v = v.toUpperCase();
                // update picker if valid hex
                if (isHex(v)) {
                    if (colorPicker) colorPicker.value = v;
                    if (sw) sw.style.background = v;
                    if (cmykEl) {
                        const rgb = hexToRgb(v);
                        const cmyk = rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 100 };
                        cmykEl.textContent = formatCMYK(cmyk);
                    }
                }
            }
        });

        // blur on hex input: normalize value (adds # and uppercase)
        orderColorsContainer.addEventListener('blur', (e) => {
            const target = e.target;
            if (!target.classList || !target.classList.contains('color-hex')) return;
            let v = (target.value || '').trim();
            if (!v) return;
            if (!v.startsWith('#')) v = '#' + v;
            v = v.toUpperCase();
            target.value = v;
            // trigger input handler to sync UI
            const ev = new Event('input', { bubbles: true });
            target.dispatchEvent(ev);
        }, true);
    } // end if (orderColorsContainer)
}); // end DOMContentLoaded
//
