// Utility functions for SpendWise
window.formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount || 0);
};

window.formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString(undefined, options);
};

window.generateID = () => {
    return Math.floor(Math.random() * 100000000);
};
