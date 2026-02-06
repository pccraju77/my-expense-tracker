// Main App Orchestration
const transactionForm = document.getElementById('transaction-form');
const transactionListContainer = document.getElementById('transaction-list-container');
const balanceEl = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const clearFiltersBtn = document.getElementById('clear-filters');
const emptyState = document.getElementById('empty-state');
const categoryPillsContainer = document.getElementById('category-pills-container');
const paginationContainer = document.getElementById('pagination-container');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-transaction-form');
const closeModalBtn = document.getElementById('close-modal');
const cancelModalBtn = document.getElementById('cancel-modal');
const modalBackdrop = document.getElementById('modal-backdrop');

let transactions = storage.getTransactions();
let editingId = null;

// Pagination & Filter State
let currentFilterType = 'all';
let currentFilterCategory = 'all';
let currentPage = 1;
const itemsPerPage = 4;

// Initialize App
const init = () => {
    updateUI();
    setupTheme();
    setupModalListeners();
    setupFilterListeners();
};

const setupFilterListeners = () => {
    // Type Pills
    const typePills = document.querySelectorAll('.filter-pill');
    typePills.forEach(pill => {
        pill.addEventListener('click', () => {
            typePills.forEach(p => p.classList.remove('active', 'bg-white', 'text-primary', 'dark:bg-slate-800'));
            typePills.forEach(p => p.classList.add('text-slate-500'));

            pill.classList.add('active');
            pill.classList.remove('text-slate-500');

            currentFilterType = pill.dataset.filterType;
            currentPage = 1; // Reset to page 1 on filter
            updateUI();
        });
    });

    // Search
    searchInput.addEventListener('input', () => {
        currentPage = 1;
        updateUI();
    });

    // Reset
    clearFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentFilterType = 'all';
        currentFilterCategory = 'all';
        currentPage = 1;

        // Reset type pills
        typePills.forEach(p => p.classList.remove('active'));
        document.querySelector('[data-filter-type="all"]').classList.add('active');

        updateUI();
    });
};

const renderCategoryPills = () => {
    const categories = [...new Set(transactions.map(t => t.category))].sort();

    categoryPillsContainer.innerHTML = `
        <button data-category="all" class="category-pill ${currentFilterCategory === 'all' ? 'active' : ''} shrink-0 px-5 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider transition-all">
            All Categories
        </button>
    `;

    categories.forEach(cat => {
        const isActive = currentFilterCategory === cat;
        const btn = document.createElement('button');
        btn.dataset.category = cat;
        btn.className = `category-pill ${isActive ? 'active' : ''} shrink-0 px-5 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider transition-all`;
        btn.innerText = cat;

        btn.onclick = () => {
            currentFilterCategory = cat;
            currentPage = 1; // Reset on category fix
            updateUI();
        };

        categoryPillsContainer.appendChild(btn);
    });

    categoryPillsContainer.querySelector('[data-category="all"]').onclick = () => {
        currentFilterCategory = 'all';
        currentPage = 1;
        updateUI();
    };
};

// ...setupModalListeners remains largely same, just calling updateUI() correctly
const setupModalListeners = () => {
    const close = () => {
        editModal.classList.add('hidden');
        editModal.classList.remove('flex');
        editingId = null;
    };

    closeModalBtn.onclick = close;
    cancelModalBtn.onclick = close;
    modalBackdrop.onclick = close;

    editForm.onsubmit = (e) => {
        e.preventDefault();

        const updatedTransaction = {
            id: editingId,
            description: document.getElementById('edit-description').value,
            amount: parseFloat(document.getElementById('edit-amount').value),
            type: document.getElementById('edit-type').value,
            category: document.getElementById('edit-category').value,
            date: document.getElementById('edit-date').value
        };

        transactions = transactions.map(t => t.id === editingId ? updatedTransaction : t);
        storage.updateTransaction(updatedTransaction);

        close();
        updateUI();
    };
};

const setupTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateChart(transactions);
    });
};

const updateUI = () => {
    const filtered = getFilteredTransactions();
    displayTransactions(filtered);
    renderPagination(filtered.length);
    updateSummary();
    updateChart(transactions);
    renderCategoryPills();
};

const getFilteredTransactions = () => {
    const searchTerm = searchInput.value.toLowerCase();
    return transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm);
        const matchesType = currentFilterType === 'all' || t.type === currentFilterType;
        const matchesCategory = currentFilterCategory === 'all' || t.category === currentFilterCategory;
        return matchesSearch && matchesType && matchesCategory;
    });
};

const displayTransactions = (list) => {
    transactionListContainer.innerHTML = '';

    if (list.length === 0) {
        emptyState.classList.remove('hidden');
        transactionListContainer.appendChild(emptyState);
        return;
    }
    emptyState.classList.add('hidden');

    // Slice for pagination
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = list.slice(start, start + itemsPerPage);

    paginatedItems.forEach((t, index) => {
        const item = document.createElement('div');
        const isExpense = t.type === 'expense';

        item.className = `transaction-item premium-glass p-4 sm:p-5 rounded-[1.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-4 reveal`;
        item.style.animationDelay = `${(index % 10) * 0.1}s`;

        item.innerHTML = `
            <div class="flex items-center gap-4 sm:gap-5">
                <div class="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-2xl ${isExpense ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'} flex items-center justify-center text-xl sm:text-2xl shadow-inner">
                    <i class="fas ${getCategoryIcon(t.category)}"></i>
                </div>
                <div class="min-w-0">
                    <h4 class="font-bold text-slate-800 dark:text-slate-200 tracking-tight truncate">${t.description}</h4>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${isExpense ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}">${t.type}</span>
                        <span class="text-xs text-slate-400 font-medium">${formatDate(t.date)} • ${t.category}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/50 pt-3 sm:pt-0">
                <div class="text-left sm:text-right">
                    <span class="text-base sm:text-lg font-black font-display tracking-tight ${isExpense ? 'text-rose-500' : 'text-emerald-500'}">
                        ${isExpense ? '-' : '+'}${formatCurrency(t.amount)}
                    </span>
                </div>
                <div class="flex items-center gap-1">
                    <button onclick="startEditing(${t.id})" class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                        <i class="fas fa-pen-to-square"></i>
                    </button>
                    <button onclick="deleteTransaction(${t.id})" class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <i class="fas fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        transactionListContainer.appendChild(item);
    });
};

const renderPagination = (totalItems) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const startIdx = (currentPage - 1) * itemsPerPage + 1;
    const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

    paginationContainer.innerHTML = `
        <span class="text-xs font-medium text-slate-400">
            Showing <span class="text-slate-700 dark:text-slate-200 font-bold">${startIdx}-${endIdx}</span> of <span class="text-slate-700 dark:text-slate-200 font-bold">${totalItems}</span>
        </span>
        <div class="flex items-center gap-2">
            <button id="prev-page" ${currentPage === 1 ? 'disabled' : ''} class="pagination-btn w-9 h-9 flex items-center justify-center rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 transition-all">
                <i class="fas fa-chevron-left text-xs"></i>
            </button>
            <div class="flex items-center gap-1">
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                    <button onclick="goToPage(${page})" class="pagination-number w-9 h-9 text-xs font-bold rounded-xl transition-all ${currentPage === page ? 'active' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}">
                        ${page}
                    </button>
                `).join('')}
            </div>
            <button id="next-page" ${currentPage === totalPages ? 'disabled' : ''} class="pagination-btn w-9 h-9 flex items-center justify-center rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 transition-all">
                <i class="fas fa-chevron-right text-xs"></i>
            </button>
        </div>
    `;

    document.getElementById('prev-page').onclick = () => { if (currentPage > 1) { currentPage--; updateUI(); } };
    document.getElementById('next-page').onclick = () => { if (currentPage < totalPages) { currentPage++; updateUI(); } };
};

window.goToPage = (page) => {
    currentPage = page;
    updateUI();
};

const getCategoryIcon = (category) => {
    const icons = { Food: 'fa-burger', Transport: 'fa-car', Shopping: 'fa-bag-shopping', Entertainment: 'fa-film', Health: 'fa-heart-pulse', Bills: 'fa-file-invoice-dollar', Salary: 'fa-money-bill-wave', Other: 'fa-star' };
    return icons[category] || 'fa-tag';
};

const updateSummary = () => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const total = income - expense;
    balanceEl.innerText = formatCurrency(total);
    incomeEl.innerText = formatCurrency(income);
    expenseEl.innerText = formatCurrency(expense);
};

transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const t = { id: generateID(), description: document.getElementById('description').value, amount: parseFloat(document.getElementById('amount').value), type: document.getElementById('type').value, category: document.getElementById('category').value, date: document.getElementById('date').value };
    transactions.unshift(t);
    storage.addTransaction(t);
    transactionForm.reset();
    currentPage = 1; // Reset to page 1 to show newest
    updateUI();
});

const startEditing = (id) => {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    editingId = id;
    document.getElementById('edit-description').value = t.description;
    document.getElementById('edit-amount').value = t.amount;
    document.getElementById('edit-type').value = t.type;
    document.getElementById('edit-category').value = t.category;
    document.getElementById('edit-date').value = t.date;
    editModal.classList.remove('hidden');
    editModal.classList.add('flex');
};

const deleteTransaction = (id) => {
    if (confirm('Delete this transaction?')) {
        transactions = transactions.filter(x => x.id !== id);
        storage.deleteTransaction(id);
        updateUI();
    }
};

const exportBtn = document.getElementById('export-btn');
exportBtn.addEventListener('click', () => {
    if (transactions.length === 0) return alert('No data to export');
    const dataStr = JSON.stringify(transactions, null, 2);
    const link = document.createElement('a');
    link.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr));
    link.setAttribute('download', 'spendwise-export.json');
    link.click();
});

init();
