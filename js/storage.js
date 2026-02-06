// LocalStorage operations
const storage = {
    getTransactions() {
        const transactions = localStorage.getItem('transactions');
        return transactions ? JSON.parse(transactions) : [];
    },

    saveTransactions(transactions) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    },

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transactions.unshift(transaction);
        this.saveTransactions(transactions);
    },

    deleteTransaction(id) {
        const transactions = this.getTransactions().filter(t => t.id !== id);
        this.saveTransactions(transactions);
    },

    updateTransaction(updatedTransaction) {
        const transactions = this.getTransactions().map(t =>
            t.id === updatedTransaction.id ? updatedTransaction : t
        );
        this.saveTransactions(transactions);
    }
};
