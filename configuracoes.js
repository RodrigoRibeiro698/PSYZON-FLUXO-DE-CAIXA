document.addEventListener('DOMContentLoaded', () => {
    const incomeList = document.getElementById('income-categories-list');
    const expenseList = document.getElementById('expense-categories-list');
    const newIncomeCategoryInput = document.getElementById('new-income-category');
    const newExpenseCategoryInput = document.getElementById('new-expense-category');
    const addIncomeCategoryBtn = document.getElementById('add-income-category-btn');
    const addExpenseCategoryBtn = document.getElementById('add-expense-category-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const businessLimitInput = document.getElementById('business-limit');
    const personalLimitInput = document.getElementById('personal-limit');
    const saveLimitsBtn = document.getElementById('save-limits-btn');

    let incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || ['Venda de Produto', 'Adiantamento', 'Serviços', 'Outros'];
    let expenseCategories = JSON.parse(localStorage.getItem('expenseCategories')) || ['Matéria-Prima (Custo Direto)', 'Aluguel', 'Contas (Água, Luz, Internet)', 'Marketing e Vendas', 'Salários e Pró-labore', 'Impostos', 'Software e Ferramentas', 'Manutenção', 'Despesas Pessoais', 'Outros'];

    const loadLimits = () => {
        const businessLimit = localStorage.getItem('businessSpendingLimit');
        const personalLimit = localStorage.getItem('personalSpendingLimit');
        if (businessLimit) businessLimitInput.value = businessLimit;
        if (personalLimit) personalLimitInput.value = personalLimit;
    };

    saveLimitsBtn.addEventListener('click', () => {
        const businessLimit = parseFloat(businessLimitInput.value);
        const personalLimit = parseFloat(personalLimitInput.value);
        if (!isNaN(businessLimit) && businessLimit >= 0) {
            localStorage.setItem('businessSpendingLimit', businessLimit);
        } else {
            localStorage.removeItem('businessSpendingLimit');
        }
        if (!isNaN(personalLimit) && personalLimit >= 0) {
            localStorage.setItem('personalSpendingLimit', personalLimit);
        } else {
            localStorage.removeItem('personalSpendingLimit');
        }
        alert('Orçamentos salvos com sucesso!');
    });

    const saveCategories = () => {
        localStorage.setItem('incomeCategories', JSON.stringify(incomeCategories));
        localStorage.setItem('expenseCategories', JSON.stringify(expenseCategories));
    };

    const renderCategories = () => {
        incomeList.innerHTML = '';
        expenseList.innerHTML = '';
        incomeCategories.forEach((cat, index) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-white/5 p-2 rounded-md';
            li.innerHTML = `<span>${cat}</span><button data-index="${index}" data-type="income" class="text-gray-500 hover:text-red-400">&times;</button>`;
            incomeList.appendChild(li);
        });
        expenseCategories.forEach((cat, index) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-white/5 p-2 rounded-md';
            li.innerHTML = `<span>${cat}</span><button data-index="${index}" data-type="expense" class="text-gray-500 hover:text-red-400">&times;</button>`;
            expenseList.appendChild(li);
        });
    };

    const addCategory = (type) => {
        if (type === 'income') {
            const newCat = newIncomeCategoryInput.value.trim();
            if (newCat && !incomeCategories.includes(newCat)) {
                incomeCategories.push(newCat);
                newIncomeCategoryInput.value = '';
            }
        } else {
            const newCat = newExpenseCategoryInput.value.trim();
            if (newCat && !expenseCategories.includes(newCat)) {
                expenseCategories.push(newCat);
                newExpenseCategoryInput.value = '';
            }
        }
        saveAndRender();
    };

    const removeCategory = (type, index) => {
        if (type === 'income') {
            incomeCategories.splice(index, 1);
        } else {
            expenseCategories.splice(index, 1);
        }
        saveAndRender();
    };

    const saveAndRender = () => {
        saveCategories();
        renderCategories();
    };
    
    addIncomeCategoryBtn.addEventListener('click', () => addCategory('income'));
    addExpenseCategoryBtn.addEventListener('click', () => addCategory('expense'));

    incomeList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') removeCategory(e.target.dataset.type, e.target.dataset.index);
    });
    expenseList.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') removeCategory(e.target.dataset.type, e.target.dataset.index);
    });

    clearDataBtn.addEventListener('click', () => {
        if (confirm("ATENÇÃO! Você tem certeza que deseja apagar TODAS as transações? Esta ação é irreversível.")) {
            if (prompt("Para confirmar, digite a palavra 'DELETAR' em maiúsculas.") === 'DELETAR') {
                localStorage.removeItem('transactions');
                alert("Todos os dados de transações foram apagados com sucesso.");
            } else {
                alert("Ação cancelada.");
            }
        }
    });

    loadLimits();
    renderCategories();
});