// Chart.js implementation for analytics
let categoryChart = null;
let trendChart = null;

window.initCharts = (data = []) => {
    window.initCategoryChart(data);
    window.initTrendChart(data);
};

window.initCategoryChart = (data) => {
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const expenses = (data || []).filter(t => t.type === 'expense');
    const categories = [...new Set(expenses.map(t => t.category))];
    const categoryTotals = categories.map(cat => {
        return expenses
            .filter(t => t.category === cat)
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    });

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';

    if (categoryChart) categoryChart.destroy();
    if (categories.length === 0) return;

    if (typeof Chart === 'undefined') return console.error("Chart.js library not loaded");

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: categoryTotals,
                backgroundColor: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4'],
                borderWidth: 4,
                borderColor: isDark ? '#0f172a' : '#ffffff',
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor, usePointStyle: true, padding: 20, font: { weight: '600', family: "'Outfit', sans-serif" } } },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: isDark ? '#f8fafc' : '#1e293b',
                    bodyColor: isDark ? '#cbd5e1' : '#64748b',
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: true
                }
            },
            cutout: '75%'
        }
    });
};

window.initTrendChart = (data) => {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const sortedData = [...(data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    const uniqueDates = [...new Set(sortedData.map(t => window.formatDate ? window.formatDate(t.date) : t.date))].slice(-7);

    const incomeData = uniqueDates.map(date => {
        return sortedData
            .filter(t => t.type === 'income' && (window.formatDate ? window.formatDate(t.date) === date : t.date === date))
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    });

    const expenseData = uniqueDates.map(date => {
        return sortedData
            .filter(t => t.type === 'expense' && (window.formatDate ? window.formatDate(t.date) === date : t.date === date))
            .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    });

    if (trendChart) trendChart.destroy();
    if (uniqueDates.length === 0) return;

    if (typeof Chart === 'undefined') return;

    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: uniqueDates,
            datasets: [
                { label: 'Income', data: incomeData, backgroundColor: '#10b981', borderRadius: 8, maxBarThickness: 20 },
                { label: 'Expense', data: expenseData, backgroundColor: '#ef4444', borderRadius: 8, maxBarThickness: 20 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { color: textColor, font: { family: "'Outfit', sans-serif" } }, border: { display: false } },
                y: { grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }, ticks: { color: textColor, font: { family: "'Outfit', sans-serif" } }, border: { display: false } }
            },
            plugins: {
                legend: { position: 'top', align: 'end', labels: { color: textColor, usePointStyle: true, font: { weight: '600', family: "'Outfit', sans-serif" } } }
            }
        }
    });
};

window.updateChart = (data) => {
    window.initCharts(data);
};
