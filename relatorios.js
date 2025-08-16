document.addEventListener('DOMContentLoaded', () => {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const typeFilter = document.getElementById('type-filter');
    const scopeFilter = document.getElementById('scope-filter');
    const categoryFilter = document.getElementById('category-filter');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const incomePeriodEl = document.getElementById('income-period');
    const expensePeriodEl = document.getElementById('expense-period');
    const balancePeriodEl = document.getElementById('balance-period');
    const reportTableBody = document.getElementById('report-table-body');
    const productionMonthInput = document.getElementById('production-month');
    const productionQuantityInput = document.getElementById('production-quantity');
    const saveProductionBtn = document.getElementById('save-production-btn');
    const productionListEl = document.getElementById('production-list');
    const calculateCostBtn = document.getElementById('calculate-cost-btn');
    
    let currentFilteredTransactions = [];
    const incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || ['Venda de Produto', 'Adiantamento', 'Serviços', 'Outros'];
    const expenseCategories = JSON.parse(localStorage.getItem('expenseCategories')) || ['Matéria-Prima (Custo Direto)', 'Aluguel', 'Contas (Água, Luz, Internet)', 'Marketing e Vendas', 'Salários e Pró-labore', 'Impostos', 'Software e Ferramentas', 'Manutenção', 'Despesas Pessoais', 'Outros'];
    let monthlyProduction = JSON.parse(localStorage.getItem('monthlyProduction')) || [];

    const formatCurrency = (amount) => amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (dateString) => new Date(dateString + 'T03:00:00').toLocaleDateString('pt-BR');

    const updateCategoryFilter = () => {
        const selectedType = typeFilter.value;
        categoryFilter.disabled = selectedType === 'all';
        scopeFilter.disabled = selectedType !== 'expense';

        if (selectedType !== 'expense') {
            scopeFilter.value = 'all';
        }

        if (selectedType !== 'all') {
            const categories = selectedType === 'income' ? incomeCategories : expenseCategories;
            categoryFilter.innerHTML = '<option value="all" class="bg-gray-800">Todas</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                option.className = 'bg-gray-800';
                categoryFilter.appendChild(option);
            });
        } else {
            categoryFilter.innerHTML = '<option value="all" class="bg-gray-800">(Selecione um Tipo)</option>';
        }
    };

    const generateReport = () => {
        const allTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const type = typeFilter.value;
        const scope = scopeFilter.value;
        const category = categoryFilter.value;

        let filteredTransactions = allTransactions.filter(t => {
            let isAfterStartDate = !startDate || t.date >= startDate;
            let isBeforeEndDate = !endDate || t.date <= endDate;
            let isTypeMatch = type === 'all' || t.type === type;
            let isScopeMatch = (t.type !== 'expense') || (scope === 'all' || t.scope === scope || (t.scope === null && scope === 'business'));
            let isCategoryMatch = category === 'all' || t.category === category;
            return isAfterStartDate && isBeforeEndDate && isTypeMatch && isScopeMatch && isCategoryMatch;
        });
        
        currentFilteredTransactions = filteredTransactions;
        updateSummaryCards(filteredTransactions);
        renderTable(filteredTransactions);
    };

    const updateSummaryCards = (transactions) => {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        const balance = income + expense;
        incomePeriodEl.textContent = formatCurrency(income);
        expensePeriodEl.textContent = formatCurrency(Math.abs(expense));
        balancePeriodEl.textContent = formatCurrency(balance);
        balancePeriodEl.classList.toggle('text-red-400', balance < 0);
        balancePeriodEl.classList.toggle('text-green-400', balance >= 0);
    };

    const renderTable = (transactions) => {
        reportTableBody.innerHTML = '';
        if (transactions.length === 0) {
            reportTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Nenhum resultado encontrado.</td></tr>`;
            return;
        }
        transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(t => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white/5';
            const colorClass = t.type === 'income' ? 'text-green-400' : 'text-red-400';
            
            let scopeText = '--';
            if (t.type === 'expense') {
                 scopeText = t.scope === 'personal' ? '👤 Pessoal' : '🏢 Empresarial';
            }

            row.innerHTML = `
                <td class="p-3">${t.description}</td>
                <td class="p-3 font-semibold ${colorClass}">${formatCurrency(Math.abs(t.amount))}</td>
                <td class="p-3 capitalize">${t.type === 'income' ? 'Receita' : 'Despesa'}</td>
                <td class="p-3">${scopeText}</td>
                <td class="p-3">${t.category}</td>
                <td class="p-3">${formatDate(t.date)}</td>
            `;
            reportTableBody.appendChild(row);
        });
    };
    
    const saveProductionData = () => {
        localStorage.setItem('monthlyProduction', JSON.stringify(monthlyProduction));
    };

    const renderProductionList = () => {
        if (!productionListEl) return;
        productionListEl.innerHTML = '';
        if (monthlyProduction.length === 0) {
            productionListEl.innerHTML = '<p class="text-gray-500">Nenhum registro de produção encontrado.</p>';
            return;
        }
        [...monthlyProduction].sort((a, b) => new Date(b.month) - new Date(a.month)).forEach(item => {
            const [year, month] = item.month.split('-');
            const formattedMonth = `${month}/${year}`;
            const li = document.createElement('div');
            li.className = 'flex justify-between items-center bg-white/5 p-2 rounded-md mb-2';
            li.innerHTML = `<div><span>Mês/Ano: <span class="font-bold">${formattedMonth}</span></span><span class="ml-4">Peças: <span class="font-bold text-teal-300">${item.quantity}</span></span></div><button data-month="${item.month}" class="delete-production-btn text-gray-500 hover:text-red-400 p-1"><svg class="w-5 h-5 pointer-events-none" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg></button>`;
            productionListEl.appendChild(li);
        });
    };

    typeFilter.addEventListener('change', updateCategoryFilter);
    generateReportBtn.addEventListener('click', generateReport);
    
    if (saveProductionBtn) {
        saveProductionBtn.addEventListener('click', () => {
            const month = productionMonthInput.value;
            const quantityToAdd = parseInt(productionQuantityInput.value, 10);
            if (!month || !quantityToAdd || quantityToAdd <= 0) { alert('Por favor, preencha o Mês/Ano e uma Quantidade válida.'); return; }
            const existingEntryIndex = monthlyProduction.findIndex(item => item.month === month);
            if (existingEntryIndex > -1) { monthlyProduction[existingEntryIndex].quantity += quantityToAdd; } else { monthlyProduction.push({ month, quantity: quantityToAdd }); }
            saveProductionData();
            renderProductionList();
            productionMonthInput.value = '';
            productionQuantityInput.value = '';
        });
    }

    if (productionListEl) {
        productionListEl.addEventListener('click', (e) => {
            const button = e.target.closest('.delete-production-btn');
            if (button) {
                const monthToDelete = button.dataset.month;
                if (confirm(`Tem certeza que deseja deletar o registro de produção do mês ${monthToDelete.split('-')[1]}/${monthToDelete.split('-')[0]}?`)) {
                    monthlyProduction = monthlyProduction.filter(item => item.month !== monthToDelete);
                    saveProductionData();
                    renderProductionList();
                }
            }
        });
    }

    if (calculateCostBtn) {
        calculateCostBtn.addEventListener('click', () => {
            const analysisMonthInput = document.getElementById('analysis-month');
            const resultsContainer = document.getElementById('cost-analysis-results');
            const totalIndirectCostsEl = document.getElementById('total-indirect-costs');
            const totalPiecesProducedEl = document.getElementById('total-pieces-produced');
            const costPerPieceEl = document.getElementById('cost-per-piece');
            const selectedMonth = analysisMonthInput.value;
            if (!selectedMonth) { alert('Por favor, selecione um mês para a análise.'); return; }
            const productionData = monthlyProduction.find(p => p.month === selectedMonth);
            const piecesProduced = productionData ? productionData.quantity : 0;
            const allTransactions = JSON.parse(localStorage.getItem('transactions')) || [];
            const totalIndirectCosts = allTransactions
                .filter(t => t.type === 'expense' && t.scope !== 'personal' && t.date.startsWith(selectedMonth) && t.category.includes('Indireto'))
                .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const costPerPiece = piecesProduced > 0 ? totalIndirectCosts / piecesProduced : 0;
            totalIndirectCostsEl.textContent = formatCurrency(totalIndirectCosts);
            totalPiecesProducedEl.textContent = piecesProduced;
            costPerPieceEl.textContent = formatCurrency(costPerPiece);
            resultsContainer.classList.remove('hidden');
        });
    }

    updateCategoryFilter();
    generateReport();
    renderProductionList();
});