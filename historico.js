// Este script é uma cópia adaptada do script.js, mas com a lógica de filtragem por mês.
document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // DOM refs
  const monthSelector = document.getElementById('month-selector');
  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('total-income');
  const expenseEl = document.getElementById('total-expense');
  const profitEl = document.getElementById('profit');
  const costPerPieceDashboardEl = document.getElementById('cost-per-piece-dashboard');
  const transactionListEl = document.getElementById('transaction-list');
  const fabricChartCtx = document.getElementById('fabricChart');
  const incomeSourceChartCtx = document.getElementById('incomeSourceChart');
  const modal = document.getElementById('modal');
  if (!modal) return;
  const form = document.getElementById('form');
  const nameInput = document.getElementById('name');
  const descriptionInput = document.getElementById('description');
  const amountInput = document.getElementById('amount');
  const dateInput = document.getElementById('date');
  const typeInput = document.getElementById('type');
  const categoryInput = document.getElementById('category');
  const quantityContainer = document.getElementById('quantity-field-container');
  const quantityInput = document.getElementById('transaction-quantity');
  const scopeContainer = document.getElementById('scope-container');
  const scopeButtons = document.querySelectorAll('.scope-btn');
  const modalTitle = modal.querySelector('h2');
  const addTransactionBtn = document.getElementById('add-transaction-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const submitBtn = form.querySelector('button[type="submit"]');
  const linkClientCheckbox = document.getElementById('link-client-checkbox');
  const clientSelectionContainer = document.getElementById('client-selection-container');
  const clientSelect = document.getElementById('client-select');
  const notificationContainer = document.getElementById('notification-container');
  const isFabricContainer = document.getElementById('is-fabric-container');
  const isFabricCheckbox = document.getElementById('is-fabric-checkbox');
  const fabricDetailsContainer = document.getElementById('fabric-details-container');
  const fabricColorInput = document.getElementById('fabric-color');
  const fabricWeightInput = document.getElementById('fabric-weight');

  // state
  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  let clients = JSON.parse(localStorage.getItem('clients')) || [];
  let productionOrders = JSON.parse(localStorage.getItem('production_orders')) || [];
  let incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || ['Venda de Produto', 'Adiantamento', 'Serviços', 'Outros'];
  let expenseCategories = JSON.parse(localStorage.getItem('expenseCategories')) || ['Matéria-Prima (Custo Direto)', 'Aluguel', 'Contas (Água, Luz, Internet)', 'Marketing e Vendas', 'Salários e Pró-labore', 'Impostos', 'Software e Ferramentas', 'Manutenção', 'Despesas Pessoais', 'Outros'];
  let editingId = null;
  let selectedScope = 'business';
  let fabricChart = null;
  let incomeSourceChart = null;

  // utils
  const saveTransactions = () => localStorage.setItem('transactions', JSON.stringify(transactions));
  const formatCurrency = (amount) => Number(amount || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (d) => new Date(d + 'T03:00:00').toLocaleDateString('pt-BR');

  const showNotification = (msg, type = 'info') => {
    if (!notificationContainer) return;
    const colors = { info: 'bg-cyan-500', warning: 'bg-yellow-500', danger: 'bg-red-500 animate-pulse' };
    const id = `notif-${Date.now()}`;
    const n = document.createElement('div');
    n.id = id;
    n.className = `relative w-full p-3 rounded shadow text-white ${colors[type]}`;
    n.innerHTML = `<p class="font-medium">${msg}</p><button class="absolute top-1 right-2 text-white/80" onclick="document.getElementById('${id}')?.remove()">×</button>`;
    notificationContainer.appendChild(n);
    setTimeout(() => n.remove(), 6000);
  };

  // helpers for UI toggles
  const toggleQuantityField = () => {
    const isProductSale = typeInput.value === 'income' && categoryInput.value === 'Venda de Produto';
    quantityContainer.classList.toggle('hidden', !isProductSale);
    quantityInput.required = isProductSale;
    if (!isProductSale) quantityInput.value = '';
  };
  const toggleFabricDetailsField = () => {
    const isExpense = typeInput.value === 'expense';
    isFabricContainer.classList.toggle('hidden', !isExpense);
    if (!isExpense) isFabricCheckbox.checked = false;
    fabricDetailsContainer.classList.toggle('hidden', !isFabricCheckbox.checked);
  };
  const toggleScopeField = () => {
    scopeContainer.classList.toggle('hidden', typeInput.value !== 'expense');
  };

  const updateCategoryOptions = () => {
    const opts = typeInput.value === 'income' ? incomeCategories : expenseCategories;
    categoryInput.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
  };

  const populateClientSelect = () => {
    clients = JSON.parse(localStorage.getItem('clients')) || [];
    clientSelect.innerHTML = '<option value="">Selecione...</option>';
    clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      clientSelect.appendChild(opt);
    });
  };

  // Build UI for selected month
  const getSelectedMonth = () => {
    // monthSelector value format: "YYYY-MM"
    return (monthSelector && monthSelector.value) ? monthSelector.value : null;
  };

  const filterTransactionsForMonth = (month) => {
    if (!month) return [];
    // month like '2025-07' -> match start of date string
    return transactions.filter(t => (t.date || '').startsWith(month));
  };

  // charts
  const updateCharts = (monthlyTransactions) => {
    // incomeSourceChart (pie)
    if (incomeSourceChart) incomeSourceChart.destroy();
    const bySource = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => { acc[t.category] = (acc[t.category]||0) + t.amount; return acc; }, {});
    if (incomeSourceChartCtx) {
      incomeSourceChart = new Chart(incomeSourceChartCtx, {
        type: 'pie',
        data: {
          labels: Object.keys(bySource),
          datasets: [{ data: Object.values(bySource), backgroundColor: ['#22c55e','#3b82f6','#eab308','#8b5cf6','#ec4899'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }

    // fabricChart (bar)
    if (fabricChart) fabricChart.destroy();
    const fabricPurchases = monthlyTransactions.filter(t => t.weightKg > 0);
    const totalSpent = fabricPurchases.reduce((s,t) => s + Math.abs(t.amount), 0);
    const totalKg = fabricPurchases.reduce((s,t) => s + (t.weightKg||0), 0);
    if (fabricChartCtx) {
      fabricChart = new Chart(fabricChartCtx, {
        type: 'bar',
        data: { labels: ['Mês'], datasets: [{ label: 'Gasto (R$)', data: [totalSpent], backgroundColor: 'rgba(239,68,68,0.8)' }, { label: 'Peso (Kg)', data: [totalKg], backgroundColor: 'rgba(59,130,246,0.8)' }] },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  };

  // render dashboard cards + list for selected month
  const renderDashboardForMonth = (month) => {
    const monthlyTransactions = filterTransactionsForMonth(month);
    // totals
    const incomeMonth = monthlyTransactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
    const expenseMonth = monthlyTransactions.filter(t => t.type === 'expense' && t.scope !== 'personal').reduce((s,t) => s + Math.abs(t.amount), 0);
    const personalExpenseMonth = monthlyTransactions.filter(t => t.type === 'expense' && t.scope === 'personal').reduce((s,t) => s + Math.abs(t.amount), 0);
    const profitMonth = incomeMonth - expenseMonth;
    // balance: compute balance at end of month -> cumulative up to end of month
    const endOfMonth = month ? `${month}-31` : null;
    let balance = 0;
    if (month) {
      // compute all transactions up to end of that month (inclusive)
      balance = transactions.filter(t => t.date && t.date <= endOfMonth).reduce((s,t) => s + t.amount, 0);
    } else {
      balance = transactions.reduce((s,t) => s + t.amount, 0);
    }

    balanceEl.textContent = formatCurrency(balance);
    incomeEl.textContent = formatCurrency(incomeMonth);
    expenseEl.textContent = formatCurrency(expenseMonth);
    profitEl.textContent = formatCurrency(profitMonth);
    profitEl.classList.toggle('text-green-400', profitMonth >= 0);
    profitEl.classList.toggle('text-red-400', profitMonth < 0);

    // cost per piece: use monthlyProduction stored separately
    const monthlyProduction = JSON.parse(localStorage.getItem('monthlyProduction')) || [];
    const prodEntry = monthlyProduction.find(p => p.month === month);
    const pieces = prodEntry ? prodEntry.quantity : 0;
    const totalIndirectCosts = monthlyTransactions.filter(t => t.type === 'expense' && t.scope !== 'personal' && t.category && t.category.includes('Indireto')).reduce((s,t) => s + Math.abs(t.amount), 0);
    const costPerPiece = pieces > 0 ? totalIndirectCosts / pieces : 0;
    costPerPieceDashboardEl.textContent = formatCurrency(costPerPiece);

    // update charts
    updateCharts(monthlyTransactions);

    // render transaction list
    transactionListEl.innerHTML = '';
    monthlyTransactions.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(tx => {
      const tr = document.createElement('tr');
      const colorClass = tx.type === 'income' ? 'text-green-400' : 'text-red-400';
      let scopeText = '--';
      if (tx.type === 'expense') scopeText = tx.scope === 'personal' ? '👤 Pessoal' : '🏢 Empresarial';
      tr.innerHTML = `
        <td class="p-3 align-top font-bold">${tx.name || '--'}</td>
        <td class="p-3 align-top text-gray-400">${tx.description || ''}</td>
        <td class="p-3 align-top font-semibold ${colorClass}">${formatCurrency(Math.abs(tx.amount))}</td>
        <td class="p-3 align-top">${scopeText}</td>
        <td class="p-3 align-top text-gray-400">${tx.category || ''}</td>
        <td class="p-3 align-top text-gray-400">${formatDate(tx.date)}</td>
        <td class="p-3 align-top">
          <div class="flex items-center gap-2">
            <button class="text-gray-500 hover:text-cyan-400" title="Editar" data-edit="${tx.id}">✎</button>
            <button class="text-gray-500 hover:text-red-400" title="Excluir" data-delete="${tx.id}">🗑</button>
          </div>
        </td>
      `;
      transactionListEl.appendChild(tr);
    });
  };

  // modal flows
  const handleSaveTransaction = (e) => {
    e.preventDefault();
    const isProductSale = typeInput.value === 'income' && categoryInput.value === 'Venda de Produto';
    if (!descriptionInput.value.trim() || !amountInput.value.trim() || !dateInput.value) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    if (isProductSale && (!quantityInput.value || parseInt(quantityInput.value,10) <= 0)) {
      alert('Informe uma quantidade válida.');
      return;
    }
    if (linkClientCheckbox.checked && !clientSelect.value) {
      alert('Selecione um cliente para vincular.');
      return;
    }
    const amount = typeInput.value === 'expense' ? -Math.abs(parseFloat(amountInput.value)) : parseFloat(amountInput.value);
    const data = {
      name: nameInput.value.trim(),
      description: descriptionInput.value.trim(),
      amount,
      date: dateInput.value,
      type: typeInput.value,
      category: categoryInput.value,
      scope: typeInput.value === 'expense' ? selectedScope : null,
      clientId: linkClientCheckbox.checked && clientSelect.value ? parseInt(clientSelect.value,10) : null,
      quantity: 0,
      weightKg: 0,
      fabricColor: null,
      id: editingId || Date.now()
    };
    if (isProductSale) data.quantity = parseInt(quantityInput.value,10) || 0;
    if (isFabricCheckbox.checked) {
      data.weightKg = parseFloat(fabricWeightInput.value) || 0;
      data.fabricColor = fabricColorInput.value.trim() || null;
    }

    if (editingId) {
      const idx = transactions.findIndex(t => t.id === editingId);
      if (idx > -1) transactions[idx] = { ...transactions[idx], ...data };
      showNotification('Lançamento atualizado', 'info');
    } else {
      transactions.push(data);
      // if product sale linked to production counting, update monthlyProduction for that transaction's month
      const month = data.date.substring(0,7);
      if (data.quantity && data.type === 'income' && data.category === 'Venda de Produto') {
        let monthlyProduction = JSON.parse(localStorage.getItem('monthlyProduction')) || [];
        const findIdx = monthlyProduction.findIndex(p => p.month === month);
        if (findIdx > -1) monthlyProduction[findIdx].quantity += data.quantity;
        else monthlyProduction.push({ month, quantity: data.quantity });
        localStorage.setItem('monthlyProduction', JSON.stringify(monthlyProduction));
      }
      showNotification('Lançamento adicionado', 'info');
    }
    saveTransactions();
    closeModal();
    renderDashboardForMonth(getSelectedMonth());
  };

  const openAddModal = () => {
    editingId = null;
    form.reset();
    updateCategoryOptions();
    toggleQuantityField();
    toggleFabricDetailsField();
    toggleScopeField();
    populateClientSelect();
    clientSelectionContainer.classList.add('hidden');
    selectedScope = 'business';
    scopeButtons.forEach(btn => btn.classList.replace('border-cyan-400','border-transparent'));
    if (document.querySelector('.scope-btn[data-scope="business"]')) document.querySelector('.scope-btn[data-scope="business"]').classList.replace('border-transparent','border-cyan-400');
    modalTitle.textContent = 'Novo Lançamento';
    submitBtn.textContent = 'Adicionar';

    const selMonth = getSelectedMonth();
    if (selMonth) {
      // set to 15th of selected month
      dateInput.value = `${selMonth}-15`;
    } else {
      dateInput.valueAsDate = new Date();
    }
    modal.classList.remove('hidden');
  };

  window.openEditModal = (id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    editingId = id;
    form.reset();
    nameInput.value = tx.name || '';
    descriptionInput.value = tx.description || '';
    amountInput.value = Math.abs(tx.amount) || 0;
    dateInput.value = tx.date;
    typeInput.value = tx.type || 'income';
    updateCategoryOptions();
    categoryInput.value = tx.category || '';
    toggleQuantityField();
    if (tx.quantity) quantityInput.value = tx.quantity;
    const isFabric = !!(tx.weightKg || tx.fabricColor);
    isFabricCheckbox.checked = isFabric;
    toggleFabricDetailsField();
    if (isFabric) {
      fabricWeightInput.value = tx.weightKg || '';
      fabricColorInput.value = tx.fabricColor || '';
    }
    toggleScopeField();
    if (tx.type === 'expense') {
      selectedScope = tx.scope || 'business';
      scopeButtons.forEach(btn => btn.classList.replace('border-cyan-400','border-transparent'));
      const el = document.querySelector(`.scope-btn[data-scope="${selectedScope}"]`);
      if (el) el.classList.replace('border-transparent','border-cyan-400');
    }
    populateClientSelect();
    if (tx.clientId) { linkClientCheckbox.checked = true; clientSelectionContainer.classList.remove('hidden'); clientSelect.value = tx.clientId; }
    else { linkClientCheckbox.checked = false; clientSelectionContainer.classList.add('hidden'); }

    modalTitle.textContent = 'Editar Lançamento';
    submitBtn.textContent = 'Salvar Alterações';
    modal.classList.remove('hidden');
  };

  const closeModal = () => {
    editingId = null;
    form.reset();
    modal.classList.add('hidden');
  };

  window.removeTransaction = (id) => {
    if (!confirm('Confirma exclusão?')) return;
    const tx = transactions.find(t => t.id === id);
    if (tx && tx.type === 'income' && tx.category === 'Venda de Produto' && tx.quantity > 0) {
      // decrement monthly production
      const month = tx.date.substring(0,7);
      let monthlyProduction = JSON.parse(localStorage.getItem('monthlyProduction')) || [];
      const idx = monthlyProduction.findIndex(p => p.month === month);
      if (idx > -1) {
        monthlyProduction[idx].quantity = Math.max(0, monthlyProduction[idx].quantity - tx.quantity);
        localStorage.setItem('monthlyProduction', JSON.stringify(monthlyProduction));
      }
    }
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderDashboardForMonth(getSelectedMonth());
    showNotification('Lançamento removido', 'warning');
  };

  // Event delegation for edit/delete buttons in table
  transactionListEl.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-delete]');
    if (editBtn) {
      const id = parseInt(editBtn.dataset.edit,10);
      window.openEditModal(id);
      return;
    }
    if (delBtn) {
      const id = parseInt(delBtn.dataset.delete,10);
      window.removeTransaction(id);
      return;
    }
  });

  // month selector change
  if (monthSelector) {
    monthSelector.addEventListener('change', () => {
      renderDashboardForMonth(getSelectedMonth());
    });
  }

  // bind UI listeners
  if (addTransactionBtn) addTransactionBtn.addEventListener('click', openAddModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (form) form.addEventListener('submit', handleSaveTransaction);
  if (typeInput) typeInput.addEventListener('change', () => { updateCategoryOptions(); toggleQuantityField(); toggleScopeField(); toggleFabricDetailsField(); });
  if (categoryInput) categoryInput.addEventListener('change', () => { toggleQuantityField(); toggleFabricDetailsField(); });
  if (linkClientCheckbox) linkClientCheckbox.addEventListener('change', () => clientSelectionContainer.classList.toggle('hidden', !linkClientCheckbox.checked));
  if (isFabricCheckbox) isFabricCheckbox.addEventListener('change', () => fabricDetailsContainer.classList.toggle('hidden', !isFabricCheckbox.checked));
  scopeButtons.forEach(btn => btn.addEventListener('click', () => {
    scopeButtons.forEach(b => b.classList.replace('border-cyan-400','border-transparent'));
    btn.classList.replace('border-transparent','border-cyan-400');
    selectedScope = btn.dataset.scope;
  }));

  // initialize month selector to previous month
  const initialize = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2,'0');
    if (monthSelector) monthSelector.value = `${y}-${m}`;
    renderDashboardForMonth(`${y}-${m}`);
  };

  initialize();
});
// Nota: O código acima é uma representação da lógica. O código completo é muito extenso.
// Por favor, use o código completo do script.js, pois ele já contém toda a lógica necessária
// para esta página funcionar, precisando apenas da adaptação inicial do seletor de mês.
// O script.js original já tem todas as funções. A mudança é mínima para criar o historico.js
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const balanceEl = document.getElementById('balance');
    const incomeEl = document.getElementById('total-income');
    const expenseEl = document.getElementById('total-expense');
    const profitEl = document.getElementById('profit');
    const costPerPieceDashboardEl = document.getElementById('cost-per-piece-dashboard');
    const transactionListEl = document.getElementById('transaction-list');
    const deadlinesListEl = document.getElementById('deadlines-list');
    const businessSpentEl = document.getElementById('business-spent');
    const businessLimitTextEl = document.getElementById('business-limit-text');
    const businessProgressEl = document.getElementById('business-progress');
    const personalSpentEl = document.getElementById('personal-spent');
    const personalLimitTextEl = document.getElementById('personal-limit-text');
    const personalProgressEl = document.getElementById('personal-progress');
    const breakEvenRevenueEl = document.getElementById('break-even-revenue');
    const breakEvenTargetEl = document.getElementById('break-even-target');
    const breakEvenRevenueBar = document.getElementById('break-even-revenue-bar');
    const breakEvenCostsBar = document.getElementById('break-even-costs-bar');
    const modal = document.getElementById('modal');
    if (!modal) return;
    const form = document.getElementById('form');
    const nameInput = document.getElementById('name');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const typeInput = document.getElementById('type');
    const categoryInput = document.getElementById('category');
    const quantityContainer = document.getElementById('quantity-field-container');
    const quantityInput = document.getElementById('transaction-quantity');
    const scopeContainer = document.getElementById('scope-container');
    const scopeButtons = document.querySelectorAll('.scope-btn');
    const modalTitle = modal.querySelector('h2');
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const submitBtn = form.querySelector('button[type="submit"]');
    const linkClientCheckbox = document.getElementById('link-client-checkbox');
    const clientSelectionContainer = document.getElementById('client-selection-container');
    const clientSelect = document.getElementById('client-select');
    const notificationContainer = document.getElementById('notification-container');
    const isFabricContainer = document.getElementById('is-fabric-container');
    const isFabricCheckbox = document.getElementById('is-fabric-checkbox');
    const fabricDetailsContainer = document.getElementById('fabric-details-container');
    const fabricColorInput = document.getElementById('fabric-color');
    const fabricWeightInput = document.getElementById('fabric-weight');

    let incomeExpenseChart, categoryChart, incomeSourceChart, fabricChart;
    let incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || ['Venda de Produto', 'Adiantamento', 'Serviços', 'Outros'];
    let expenseCategories = JSON.parse(localStorage.getItem('expenseCategories')) || ['Matéria-Prima (Custo Direto)', 'Aluguel', 'Contas (Água, Luz, Internet)', 'Marketing e Vendas', 'Salários e Pró-labore', 'Impostos', 'Software e Ferramentas', 'Manutenção', 'Despesas Pessoais', 'Outros'];
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    let productionOrders = JSON.parse(localStorage.getItem('production_orders')) || [];
    let editingId = null; 
    let selectedScope = 'business';

    const saveTransactions = () => localStorage.setItem('transactions', JSON.stringify(transactions));
    const formatCurrency = (amount) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (dateString) => new Date(dateString + 'T03:00:00').toLocaleDateString('pt-BR');

    const getProgressColorClass = (percentage) => {
        if (percentage <= 50) return 'bg-gradient-green';
        if (percentage <= 80) return 'bg-gradient-yellow';
        return 'bg-gradient-red';
    };

    const showNotification = (message, type = 'info') => {
        if (!notificationContainer) return;
        const colors = { info: 'bg-cyan-500', warning: 'bg-yellow-500', danger: 'bg-red-500 animate-pulse' };
        const notificationId = `notif-${Date.now()}`;
        const notification = document.createElement('div');
        notification.id = notificationId;
        notification.className = `relative w-full p-4 rounded-lg shadow-lg text-white ${colors[type]} transform translate-x-full opacity-0 transition-all duration-500 ease-out`;
        notification.innerHTML = `<p class="font-bold text-sm">${message}</p><button onclick="document.getElementById('${notificationId}').remove()" class="absolute top-1 right-1 text-white/70 hover:text-white">&times;</button>`;
        notificationContainer.appendChild(notification);
        setTimeout(() => { notification.classList.remove('translate-x-full', 'opacity-0'); }, 100);
        setTimeout(() => { notification.remove(); }, 7000);
    };

    const checkDeadlinesAndNotify = () => {
        productionOrders = JSON.parse(localStorage.getItem('production_orders')) || [];
        clients = JSON.parse(localStorage.getItem('clients')) || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const urgentOrders = productionOrders.filter(order => order.status !== 'done').map(order => {
            const deadline = new Date(order.deadline + 'T03:00:00');
            const diffTime = deadline - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...order, diffDays };
        }).filter(order => order.diffDays <= 3);
        if (urgentOrders.length > 0) {
            urgentOrders.forEach(order => {
                const client = clients.find(c => c.id === order.clientId);
                const clientName = client ? client.name : 'Cliente';
                let message = '', type = 'warning';
                if (order.diffDays < 0) {
                    message = `ATRASADO: Pedido de ${clientName} está ${Math.abs(order.diffDays)} dias atrasado!`;
                    type = 'danger';
                } else if (order.diffDays === 0) {
                    message = `URGENTE: Pedido de ${clientName} vence HOJE!`;
                    type = 'danger';
                } else {
                    message = `Atenção: Pedido de ${clientName} vence em ${order.diffDays} dias.`;
                }
                showNotification(message, type);
            });
        }
    };

    const toggleQuantityField = () => {
        const isProductSale = typeInput.value === 'income' && categoryInput.value === 'Venda de Produto';
        quantityContainer.classList.toggle('hidden', !isProductSale);
        quantityInput.required = isProductSale;
        if (!isProductSale) quantityInput.value = '';
    };

    const toggleFabricDetailsField = () => {
        const isExpense = typeInput.value === 'expense';
        isFabricContainer.classList.toggle('hidden', !isExpense);
        
        if (!isExpense) {
            isFabricCheckbox.checked = false;
        }
        fabricDetailsContainer.classList.toggle('hidden', !isFabricCheckbox.checked);
    };

    const toggleScopeField = () => {
        scopeContainer.classList.toggle('hidden', typeInput.value !== 'expense');
    };
    
    const updateCategoryOptions = () => {
        const options = typeInput.value === 'income' ? incomeCategories : expenseCategories;
        categoryInput.innerHTML = options.map(cat => `<option value="${cat}" class="bg-gray-800">${cat}</option>`).join('');
    };
    
    const populateClientSelect = () => {
        clients = JSON.parse(localStorage.getItem('clients')) || [];
        clientSelect.innerHTML = '<option value="" class="bg-gray-800">Selecione...</option>';
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            option.className = 'bg-gray-800';
            clientSelect.appendChild(option);
        });
    };

    scopeButtons.forEach(button => {
        button.addEventListener('click', () => {
            scopeButtons.forEach(btn => btn.classList.replace('border-cyan-400', 'border-transparent'));
            button.classList.replace('border-transparent', 'border-cyan-400');
            selectedScope = button.dataset.scope;
        });
    });

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const isProductSale = typeInput.value === 'income' && categoryInput.value === 'Venda de Produto';
        if (!descriptionInput.value.trim() || !amountInput.value.trim() || !dateInput.value) { alert('Por favor, preencha todos os campos obrigatórios.'); return; }
        if (isProductSale && (!quantityInput.value || parseInt(quantityInput.value, 10) <= 0)) { alert('Por favor, informe uma quantidade de peças válida.'); return; }
        if (linkClientCheckbox.checked && !clientSelect.value) { alert('Por favor, selecione um cliente.'); return; }

        const amount = typeInput.value === 'expense' ? -Math.abs(parseFloat(amountInput.value)) : parseFloat(amountInput.value);
        
        const transactionData = {
            name: nameInput.value.trim(),
            description: descriptionInput.value.trim(),
            amount,
            date: dateInput.value,
            type: typeInput.value,
            category: categoryInput.value,
            scope: typeInput.value === 'expense' ? selectedScope : null,
            clientId: linkClientCheckbox.checked && clientSelect.value ? parseInt(clientSelect.value) : null,
            quantity: 0,
            weightKg: 0,
            fabricColor: null
        };

        if (isProductSale) {
            transactionData.quantity = parseInt(quantityInput.value, 10) || 0;
        }
        if (isFabricCheckbox.checked) {
            transactionData.weightKg = parseFloat(fabricWeightInput.value) || 0;
            transactionData.fabricColor = fabricColorInput.value.trim() || null;
        }

        let newTransactionId = null;
        if (editingId) {
            const transactionIndex = transactions.findIndex(t => t.id === editingId);
            if (transactionIndex > -1) {
                transactions[transactionIndex] = { ...transactions[transactionIndex], ...transactionData };
            }
        } else {
            const newTransaction = { ...transactionData, id: Date.now() };
            transactions.push(newTransaction);
            newTransactionId = newTransaction.id;
            if (isProductSale) {
                updateMonthlyProduction(newTransaction.date.substring(0, 7), newTransaction.quantity);
            }
        }
        
        saveTransactions();
        updateUI();
        closeModal();

        const isLinkedProductSale = isProductSale && transactionData.clientId;
        if (isLinkedProductSale && newTransactionId) {
            setTimeout(() => {
                if (confirm("Venda registrada com sucesso! Deseja criar um pedido de produção para este item na aba 'Processos'?")) {
                    const client = clients.find(c => c.id === transactionData.clientId);
                    const prefillData = { description: transactionData.description, clientId: transactionData.clientId };
                    localStorage.setItem('prefill_order_form', JSON.stringify(prefillData));
                    window.location.href = 'processos.html?action=new_order';
                }
            }, 500);
        }
    };

    const openAddModal = () => {
        editingId = null;
        form.reset();
        dateInput.valueAsDate = new Date();
        updateCategoryOptions();
        toggleQuantityField();
        toggleFabricDetailsField();
        toggleScopeField();
        populateClientSelect();
        clientSelectionContainer.classList.add('hidden');
        selectedScope = 'business';
        scopeButtons.forEach(btn => btn.classList.replace('border-cyan-400', 'border-transparent'));
        if (document.querySelector('.scope-btn[data-scope="business"]')) {
            document.querySelector('.scope-btn[data-scope="business"]').classList.replace('border-transparent', 'border-cyan-400');
        }
        modalTitle.textContent = 'Novo Lançamento';
        submitBtn.textContent = 'Adicionar';
        modal.classList.remove('hidden');
    };

    window.openEditModal = (id) => {
        editingId = id;
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        form.reset();
        nameInput.value = transaction.name || '';
        descriptionInput.value = transaction.description;
        amountInput.value = Math.abs(transaction.amount);
        dateInput.value = transaction.date;
        typeInput.value = transaction.type;
        updateCategoryOptions();
        categoryInput.value = transaction.category;
        
        toggleQuantityField();
        if (transaction.quantity) { quantityInput.value = transaction.quantity; }
        
        const isFabric = !!(transaction.weightKg || transaction.fabricColor);
        isFabricCheckbox.checked = isFabric;
        toggleFabricDetailsField();

        if (isFabric) {
            fabricWeightInput.value = transaction.weightKg || '';
            fabricColorInput.value = transaction.fabricColor || '';
        }

        toggleScopeField();
        if (transaction.type === 'expense') {
            selectedScope = transaction.scope || 'business';
            scopeButtons.forEach(btn => btn.classList.replace('border-cyan-400', 'border-transparent'));
            if(document.querySelector(`.scope-btn[data-scope="${selectedScope}"]`)){
                document.querySelector(`.scope-btn[data-scope="${selectedScope}"]`).classList.replace('border-transparent', 'border-cyan-400');
            }
        }

        populateClientSelect();
        if (transaction.clientId) {
            linkClientCheckbox.checked = true;
            clientSelectionContainer.classList.remove('hidden');
            clientSelect.value = transaction.clientId;
        } else {
            linkClientCheckbox.checked = false;
            clientSelectionContainer.classList.add('hidden');
        }

        modalTitle.textContent = 'Editar Lançamento';
        submitBtn.textContent = 'Salvar Alterações';
        modal.classList.remove('hidden');
    };

    const closeModal = () => {
        editingId = null;
        form.reset();
        modal.classList.add('hidden');
    };

    const updateMonthlyProduction = (month, quantity) => {
        let monthlyProduction = JSON.parse(localStorage.getItem('monthlyProduction')) || [];
        const existingEntryIndex = monthlyProduction.findIndex(item => item.month === month);
        if (existingEntryIndex > -1) {
            monthlyProduction[existingEntryIndex].quantity += quantity;
        } else {
            monthlyProduction.push({ month: month, quantity: quantity });
        }
        localStorage.setItem('monthlyProduction', JSON.stringify(monthlyProduction));
    };
    
    window.removeTransaction = (id) => {
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            const transactionToDelete = transactions.find(t => t.id === id);
            if (transactionToDelete && transactionToDelete.type === 'income' && transactionToDelete.category === 'Venda de Produto' && transactionToDelete.quantity > 0) {
                updateMonthlyProduction(transactionToDelete.date.substring(0, 7), -transactionToDelete.quantity);
            }
            transactions = transactions.filter(t => t.id !== id);
            updateUI();
        }
    };
    
    const addTransactionToDOM = (transaction) => {
        const { id, name, description, amount, date, category, type, scope } = transaction;
        const item = document.createElement('tr');
        const colorClass = type === 'income' ? 'text-green-400' : 'text-red-400';
        let scopeText = '--';
        if (type === 'expense') {
            scopeText = scope === 'personal' ? '👤 Pessoal' : '🏢 Empresarial';
        }
        item.innerHTML = `
            <td class="p-3 align-top font-bold">${name || '--'}</td>
            <td class="p-3 align-top text-gray-400">${description}</td>
            <td class="p-3 align-top font-semibold ${colorClass}">${formatCurrency(Math.abs(amount))}</td>
            <td class="p-3 align-top">${scopeText}</td>
            <td class="p-3 align-top text-gray-400">${category}</td>
            <td class="p-3 align-top text-gray-400">${formatDate(date)}</td>
            <td class="p-3 align-top"><div class="flex items-center gap-2"><button onclick="openEditModal(${id})" class="text-gray-500 hover:text-cyan-400" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path></svg></button><button onclick="removeTransaction(${id})" class="text-gray-500 hover:text-red-400" title="Excluir"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button></div></td>
        `;
        transactionListEl.appendChild(item);
    };

    const updateDeadlinesCard = () => {
        productionOrders = JSON.parse(localStorage.getItem('production_orders')) || [];
        clients = JSON.parse(localStorage.getItem('clients')) || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingOrders = productionOrders.filter(order => order.status !== 'done').map(order => {
            const deadline = new Date(order.deadline + 'T03:00:00');
            const diffTime = deadline - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...order, diffDays };
        }).sort((a, b) => a.diffDays - b.diffDays).slice(0, 3);
        deadlinesListEl.innerHTML = '';
        if (upcomingOrders.length === 0) {
            deadlinesListEl.innerHTML = '<p class="text-sm text-gray-500">Nenhum prazo pendente. 🎉</p>';
            return;
        }
        upcomingOrders.forEach(order => {
            const client = clients.find(c => c.id === order.clientId);
            let deadlineColor = 'text-gray-400';
            let deadlineText = `Vence em ${order.diffDays} dias`;
            if (order.diffDays < 0) {
                deadlineColor = 'text-red-500 font-bold animate-pulse';
                deadlineText = `ATRASADO HÁ ${Math.abs(order.diffDays)} DIAS`;
            } else if (order.diffDays <= 3) {
                deadlineColor = 'text-yellow-400 font-semibold';
            }
            if (order.diffDays === 0) deadlineText = "Vence Hoje!";
            if (order.diffDays === 1) deadlineText = "Vence Amanhã!";
            const item = document.createElement('div');
            item.className = 'border-b border-white/10 pb-2';
            item.innerHTML = `<p class="font-semibold">${order.description}</p><div class="flex justify-between items-center text-sm"><span class="text-gray-400">${client ? client.name : 'Cliente'}</span><span class="${deadlineColor}">${deadlineText}</span></div>`;
            deadlinesListEl.appendChild(item);
        });
    };
    
    const updateCharts = (monthlyTransactions) => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyData = Array(12).fill(null).map(() => ({ income: 0, expense: 0 }));
        transactions.forEach(t => {
            const month = new Date(t.date + 'T03:00:00').getMonth();
            if (t.type === 'income') monthlyData[month].income += t.amount;
            else if (t.scope !== 'personal') monthlyData[month].expense += Math.abs(t.amount);
        });
        const chartOptions = { color: '#e0e0e0', family: 'Inter' };
        
        const lineChartCtx = document.getElementById('incomeExpenseChart');
        if (lineChartCtx) { if (incomeExpenseChart) incomeExpenseChart.destroy(); incomeExpenseChart = new Chart(lineChartCtx, { type: 'line', data: { labels: months, datasets: [{ label: 'Receita', data: monthlyData.map(d => d.income), borderColor: '#34d399', backgroundColor: '#34d39920', tension: 0.3, fill: true }, { label: 'Despesa Empresarial', data: monthlyData.map(d => d.expense), borderColor: '#f87171', backgroundColor: '#f8717120', tension: 0.3, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: chartOptions.color } } }, scales: { y: { beginAtZero: true, ticks: { color: chartOptions.color }, grid: { color: '#ffffff1a' } }, x: { ticks: { color: chartOptions.color }, grid: { color: '#ffffff1a' } } } } }); }
        
        const doughnutChartCtx = document.getElementById('categoryChart');
        if (doughnutChartCtx) {
            const expenseByCategory = monthlyTransactions.filter(t => t.type === 'expense' && t.scope !== 'personal').reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount); return acc; }, {});
            if (categoryChart) categoryChart.destroy();
            categoryChart = new Chart(doughnutChartCtx, { type: 'doughnut', data: { labels: Object.keys(expenseByCategory), datasets: [{ data: Object.values(expenseByCategory), backgroundColor: ['#9333ea', '#db2777', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#6b7280'], borderColor: '#111827', borderWidth: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        }

        const incomeSourceChartCtx = document.getElementById('incomeSourceChart');
        if (incomeSourceChartCtx) {
            const incomeByCategory = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {});
            if (incomeSourceChart) incomeSourceChart.destroy();
            incomeSourceChart = new Chart(incomeSourceChartCtx, { type: 'pie', data: { labels: Object.keys(incomeByCategory), datasets: [{ data: Object.values(incomeByCategory), backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#8b5cf6', '#ec4899'], borderColor: '#111827', borderWidth: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
        }
    };
    
    const updateFabricChart = (monthlyTransactions) => {
        const fabricPurchases = monthlyTransactions.filter(t => t.weightKg > 0);
        const totalSpent = fabricPurchases.reduce((acc, t) => acc + Math.abs(t.amount), 0);
        const totalKg = fabricPurchases.reduce((acc, t) => acc + (t.weightKg || 0), 0);
        const ctx = document.getElementById('fabricChart');
        if (!ctx) return;
        const chartOptions = {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#e0e0e0' } } },
            scales: {
                y: { type: 'linear', display: true, position: 'left', ticks: { color: '#e0e0e0' }, grid: { color: '#ffffff1a' }, title: { display: true, text: 'Gasto (R$)', color: '#e0e0e0' } },
                y1: { type: 'linear', display: true, position: 'right', ticks: { color: '#e0e0e0' }, grid: { drawOnChartArea: false }, title: { display: true, text: 'Peso (Kg)', color: '#e0e0e0' } }
            }
        };
        if (fabricChart) {
            fabricChart.data.datasets[0].data = [totalSpent];
            fabricChart.data.datasets[1].data = [totalKg];
            fabricChart.update();
        } else {
            fabricChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Mês Atual'],
                    datasets: [
                        { label: 'Gasto (R$)', data: [totalSpent], backgroundColor: 'rgba(239, 68, 68, 0.7)', yAxisID: 'y' },
                        { label: 'Peso (Kg)', data: [totalKg], backgroundColor: 'rgba(59, 130, 246, 0.7)', yAxisID: 'y1' }
                    ]
                },
                options: chartOptions
            });
        }
    };

    const updateUI = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const totalBalance = transactions.reduce((acc, t) => acc + t.amount, 0);
        const monthlyTransactions = transactions.filter(t => {
            const date = new Date(t.date + 'T03:00:00');
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        const incomeMonth = monthlyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const businessExpenseMonth = monthlyTransactions.filter(t => t.type === 'expense' && t.scope !== 'personal').reduce((acc, t) => acc + t.amount, 0);
        const personalExpenseMonth = monthlyTransactions.filter(t => t.type === 'expense' && t.scope === 'personal').reduce((acc, t) => acc + t.amount, 0);
        const profitMonth = incomeMonth + businessExpenseMonth;
        balanceEl.textContent = formatCurrency(totalBalance);
        incomeEl.textContent = formatCurrency(incomeMonth);
        expenseEl.textContent = formatCurrency(Math.abs(businessExpenseMonth));
        profitEl.textContent = formatCurrency(profitMonth);
        profitEl.classList.toggle('text-red-400', profitMonth < 0);
        profitEl.classList.toggle('text-green-400', profitMonth >= 0);
        const businessLimit = parseFloat(localStorage.getItem('businessSpendingLimit')) || 0;
        const personalLimit = parseFloat(localStorage.getItem('personalSpendingLimit')) || 0;
        const businessPercent = businessLimit > 0 ? (Math.abs(businessExpenseMonth) / businessLimit) * 100 : 0;
        businessSpentEl.textContent = formatCurrency(Math.abs(businessExpenseMonth));
        businessLimitTextEl.textContent = `de ${formatCurrency(businessLimit)}`;
        businessProgressEl.style.width = `${Math.min(businessPercent, 100)}%`;
        businessProgressEl.className = `h-4 rounded-full transition-all duration-500 ${getProgressColorClass(businessPercent)}`;
        const personalPercent = personalLimit > 0 ? (Math.abs(personalExpenseMonth) / personalLimit) * 100 : 0;
        personalSpentEl.textContent = formatCurrency(Math.abs(personalExpenseMonth));
        personalLimitTextEl.textContent = `de ${formatCurrency(personalLimit)}`;
        personalProgressEl.style.width = `${Math.min(personalPercent, 100)}%`;
        personalProgressEl.className = `h-4 rounded-full transition-all duration-500 ${getProgressColorClass(personalPercent)}`;
        const totalMonthlyCosts = Math.abs(businessExpenseMonth) + Math.abs(personalExpenseMonth);
        breakEvenRevenueEl.textContent = `Receita: ${formatCurrency(incomeMonth)}`;
        breakEvenTargetEl.textContent = `Custos: ${formatCurrency(totalMonthlyCosts)}`;
        const totalValue = incomeMonth + totalMonthlyCosts;
        let revenueShare = 0, costsShare = 100;
        if (totalValue > 0) {
            revenueShare = (incomeMonth / totalValue) * 100;
            costsShare = (totalMonthlyCosts / totalValue) * 100;
        } else if (incomeMonth > 0) { revenueShare = 100; costsShare = 0; }
        breakEvenRevenueBar.style.width = `${revenueShare}%`;
        breakEvenRevenueBar.textContent = `${revenueShare.toFixed(0)}%`;
        breakEvenCostsBar.style.width = `${costsShare}%`;
        breakEvenCostsBar.textContent = `${costsShare.toFixed(0)}%`;
        if(costPerPieceDashboardEl) {
            const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const monthlyProduction = JSON.parse(localStorage.getItem('monthlyProduction')) || [];
            const productionData = monthlyProduction.find(p => p.month === currentMonthStr);
            const piecesProduced = productionData ? productionData.quantity : 0;
            const totalIndirectCosts = monthlyTransactions.filter(t => t.type === 'expense' && t.scope !== 'personal' && t.category.includes('Indireto')).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            let costPerPiece = piecesProduced > 0 ? totalIndirectCosts / piecesProduced : 0;
            costPerPieceDashboardEl.textContent = formatCurrency(costPerPiece);
        }
        transactionListEl.innerHTML = '';
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).forEach(addTransactionToDOM);
        
        updateCharts(monthlyTransactions);
        updateFabricChart(monthlyTransactions);
        saveTransactions();
        updateDeadlinesCard();
    };
    
    // --- EVENT LISTENERS ---
    if (mobileMenuButton) { mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden')); }
    if(addTransactionBtn) addTransactionBtn.addEventListener('click', openAddModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if(form) form.addEventListener('submit', handleFormSubmit);
    if(typeInput) typeInput.addEventListener('change', () => { updateCategoryOptions(); toggleQuantityField(); toggleScopeField(); toggleFabricDetailsField(); });
    if(categoryInput) categoryInput.addEventListener('change', () => { toggleQuantityField(); toggleFabricDetailsField(); });
    if(linkClientCheckbox) linkClientCheckbox.addEventListener('change', () => {
        clientSelectionContainer.classList.toggle('hidden', !linkClientCheckbox.checked);
    });
    if(isFabricCheckbox) isFabricCheckbox.addEventListener('change', () => {
        fabricDetailsContainer.classList.toggle('hidden', !isFabricCheckbox.checked);
    });
    
    // --- INICIALIZAÇÃO ---
    updateUI();
    setTimeout(checkDeadlinesAndNotify, 2000);
});