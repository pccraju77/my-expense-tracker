// LocalStorage operations with default seed data
const storage = {
    getTransactions() {
        const transactions = localStorage.getItem('transactions');
        if (transactions) {
            return JSON.parse(transactions);
        } else {
            // Default seed data for new users or fresh deployments
            const defaultData = [
                { id: 1001, description: "Grocery", amount: 500, type: "expense", category: "Shopping", date: "2026-02-01" },
                { id: 1002, description: "Sabarimala Trip", amount: 1500, type: "expense", category: "Transport", date: "2026-01-03" },
                { id: 1003, description: "Sarvam Maaya", amount: 500, type: "expense", category: "Entertainment", date: "2026-01-31" },
                { id: 1004, description: "Salary", amount: 25000, type: "income", category: "Salary", date: "2026-02-05" }
            ];
            this.saveTransactions(defaultData);
            return defaultData;
        }
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
