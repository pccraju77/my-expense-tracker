// Main App Orchestration
const getEl = (id) => document.getElementById(id);

// UI Elements
const transactionForm = getEl('transaction-form');
const transactionListContainer = getEl('transaction-list-container');
const balanceEl = getEl('total-balance');
const incomeEl = getEl('total-income');
const expenseEl = getEl('total-expense');
const themeToggle = getEl('theme-toggle');
const searchInput = getEl('search-input');
const clearFiltersBtn = getEl('clear-filters');
const emptyState = getEl('empty-state');
const categoryPillsContainer = getEl('category-pills-container');
const paginationContainer = getEl('pagination-container');

// Modal Elements
const editModal = getEl('edit-modal');
const editForm = getEl('edit-transaction-form');
const closeModalBtn = getEl('close-modal');
const cancelModalBtn = getEl('cancel-modal');
const modalBackdrop = getEl('modal-backdrop');

// State
let transactions = [];
let editingId = null;
let currentFilterType = 'all';
let currentFilterCategory = 'all';
let currentPage = 1;
const itemsPerPage = 4;

// Initialize
const init = () => {
    transactions = storage.getTransactions() || [];
    updateUI();
    setupTheme();
    setupModalListeners();
    setupFilterListeners();
};

const setupFilterListeners = () => {
    const typePills = document.querySelectorAll('.filter-pill');
    typePills.forEach(pill => {
        pill.addEventListener('click', () => {
            typePills.forEach(p => p.classList.remove('active', 'bg-white', 'text-primary', 'dark:bg-slate-800'));
            typePills.forEach(p => p.classList.add('text-slate-500'));
            pill.classList.add('active');
            pill.classList.remove('text-slate-500');
            currentFilterType = pill.dataset.filterType;
            currentPage = 1;
            updateUI();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            updateUI();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentFilterType = 'all';
            currentFilterCategory = 'all';
            currentPage = 1;
            typePills.forEach(p => p.classList.remove('active'));
            const allPill = document.querySelector('[data-filter-type="all"]');
            if (allPill) allPill.classList.add('active');
            updateUI();
        });
    }
};

const renderCategoryPills = () => {
    if (!categoryPillsContainer) return;
    const categories = [...new Set(transactions.map(t => t.category))].sort();

    categoryPillsContainer.innerHTML = `
        <button data-category="all" class="category-pill ${currentFilterCategory === 'all' ? 'active' : ''} shrink-0 px-5 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider transition-all">
            All Categories
        </button>
    `;

    categories.forEach(cat => {
        const isActive = currentFilterCategory === cat;
        const btn = document.createElement('button');
        btn.className = `category-pill ${isActive ? 'active' : ''} shrink-0 px-5 py-2 rounded-full border border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider transition-all`;
        btn.innerText = cat;
        btn.onclick = () => {
            currentFilterCategory = cat;
            currentPage = 1;
            updateUI();
        };
        categoryPillsContainer.appendChild(btn);
    });

    const allBtn = categoryPillsContainer.querySelector('[data-category="all"]');
    if (allBtn) {
        allBtn.onclick = () => {
            currentFilterCategory = 'all';
            currentPage = 1;
            updateUI();
        };
    }
};

const setupModalListeners = () => {
    const close = () => {
        if (editModal) {
            editModal.classList.add('hidden');
            editModal.classList.remove('flex');
        }
        editingId = null;
    };

    if (closeModalBtn) closeModalBtn.onclick = close;
    if (cancelModalBtn) cancelModalBtn.onclick = close;
    if (modalBackdrop) modalBackdrop.onclick = close;

    if (editForm) {
        editForm.onsubmit = (e) => {
            e.preventDefault();
            const updated = {
                id: editingId,
                description: getEl('edit-description').value,
                amount: parseFloat(getEl('edit-amount').value),
                type: getEl('edit-type').value,
                category: getEl('edit-category').value,
                date: getEl('edit-date').value
            };
            transactions = transactions.map(t => t.id === editingId ? updated : t);
            storage.updateTransaction(updated);
            close();
            updateUI();
        };
    }
};

const setupTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (typeof updateChart === 'function') updateChart(transactions);
        });
    }
};

const updateUI = () => {
    const filtered = getFilteredTransactions();
    displayTransactions(filtered);
    renderPagination(filtered.length);
    updateSummary();
    if (typeof updateChart === 'function') updateChart(transactions);
    renderCategoryPills();
};

const getFilteredTransactions = () => {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    return transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm);
        const matchesType = currentFilterType === 'all' || t.type === currentFilterType;
        const matchesCategory = currentFilterCategory === 'all' || t.category === currentFilterCategory;
        return matchesSearch && matchesType && matchesCategory;
    });
};

const displayTransactions = (list) => {
    if (!transactionListContainer) return;
    transactionListContainer.innerHTML = '';

    if (list.length === 0) {
        if (emptyState) {
            emptyState.classList.remove('hidden');
            transactionListContainer.appendChild(emptyState);
        }
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');

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
                    <i class="fas ${window.getCategoryIcon ? window.getCategoryIcon(t.category) : 'fa-tag'}"></i>
                </div>
                <div class="min-w-0">
                    <h4 class="font-bold text-slate-800 dark:text-slate-200 tracking-tight truncate">${t.description}</h4>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                        <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${isExpense ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}">${t.type}</span>
                        <span class="text-xs text-slate-400 font-medium">${window.formatDate ? window.formatDate(t.date) : t.date} • ${t.category}</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/50 pt-3 sm:pt-0">
                <div class="text-left sm:text-right">
                    <span class="text-base sm:text-lg font-black font-display tracking-tight ${isExpense ? 'text-rose-500' : 'text-emerald-500'}">
                        ${isExpense ? '-' : '+'}${window.formatCurrency ? window.formatCurrency(t.amount) : t.amount}
                    </span>
                </div>
                <div class="flex items-center gap-1">
                    <button onclick="window.startEditing(${t.id})" class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-all">
                        <i class="fas fa-pen-to-square"></i>
                    </button>
                    <button onclick="window.deleteTransaction(${t.id})" class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <i class="fas fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        transactionListContainer.appendChild(item);
    });
};

const renderPagination = (totalItems) => {
    if (!paginationContainer) return;
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
                    <button onclick="window.goToPage(${page})" class="pagination-number w-9 h-9 text-xs font-bold rounded-xl transition-all ${currentPage === page ? 'active' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}">
                        ${page}
                    </button>
                `).join('')}
            </div>
            <button id="next-page" ${currentPage === totalPages ? 'disabled' : ''} class="pagination-btn w-9 h-9 flex items-center justify-center rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-slate-500 transition-all">
                <i class="fas fa-chevron-right text-xs"></i>
            </button>
        </div>
    `;

    const prev = getEl('prev-page');
    const next = getEl('next-page');
    if (prev) prev.onclick = () => { if (currentPage > 1) { currentPage--; updateUI(); } };
    if (next) next.onclick = () => { if (currentPage < totalPages) { currentPage++; updateUI(); } };
};

// Global Exposed Functions
window.goToPage = (page) => {
    currentPage = page;
    updateUI();
};

window.getCategoryIcon = (category) => {
    const icons = { Food: 'fa-burger', Transport: 'fa-car', Shopping: 'fa-bag-shopping', Entertainment: 'fa-film', Health: 'fa-heart-pulse', Bills: 'fa-file-invoice-dollar', Salary: 'fa-money-bill-wave', Other: 'fa-star' };
    return icons[category] || 'fa-tag';
};

window.startEditing = (id) => {
    const t = transactions.find(x => x.id === id);
    if (!t) return;
    editingId = id;
    getEl('edit-description').value = t.description;
    getEl('edit-amount').value = t.amount;
    getEl('edit-type').value = t.type;
    getEl('edit-category').value = t.category;
    getEl('edit-date').value = t.date;
    if (editModal) {
        editModal.classList.remove('hidden');
        editModal.classList.add('flex');
    }
};

window.deleteTransaction = (id) => {
    if (confirm('Delete this transaction?')) {
        transactions = transactions.filter(x => x.id !== id);
        storage.deleteTransaction(id);
        updateUI();
    }
};

const updateSummary = () => {
    if (!balanceEl || !incomeEl || !expenseEl) return;
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const total = income - expense;
    if (window.formatCurrency) {
        balanceEl.innerText = window.formatCurrency(total);
        incomeEl.innerText = window.formatCurrency(income);
        expenseEl.innerText = window.formatCurrency(expense);
    } else {
        balanceEl.innerText = total.toFixed(2);
    }
};

if (transactionForm) {
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const desc = getEl('description').value;
        const amt = parseFloat(getEl('amount').value);
        if (!desc || isNaN(amt)) return alert("Please enter valid detail and amount");

        const t = {
            id: window.generateID ? window.generateID() : Date.now(),
            description: desc,
            amount: amt,
            type: getEl('type').value,
            category: getEl('category').value,
            date: getEl('date').value
        };
        transactions.unshift(t);
        storage.addTransaction(t);
        transactionForm.reset();
        currentPage = 1;
        updateUI();
    });
}

// Kickoff
document.addEventListener('DOMContentLoaded', init);
// Also try to init immediately if DOM is already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
}
