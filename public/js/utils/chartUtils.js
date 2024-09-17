// chartUtils.js

export function renderChart(chartInstance, chartId, transactions, type) {
    // Destroy previous chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Get the canvas context
    const ctx = document.getElementById(chartId).getContext('2d');

    // Filter transactions by type and exclude future recurring transactions
    const currentDate = new Date();
    const filteredTransactions = transactions.filter(transaction => {
        const isPastTransaction = !transaction.isRecurring || new Date(transaction.date) <= currentDate;
        const isNotFutureRecurring = !transaction.isRecurring || !transaction.recurring || new Date(transaction.recurring.nextTransactionDate) <= currentDate;
        return transaction.type === type && isPastTransaction && isNotFutureRecurring;
    });

    // Calculate category sums
    const categorySums = {};
    filteredTransactions.forEach(transaction => {
        categorySums[transaction.category] = (categorySums[transaction.category] || 0) + transaction.amount;
    });

    const labels = Object.keys(categorySums);
    const data = Object.values(categorySums);

    // Create the new chart
    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: `Amount ${type === 'expense' ? 'Spent' : 'Earned'}`,
                data: data,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        }
    });

    return chartInstance;
}