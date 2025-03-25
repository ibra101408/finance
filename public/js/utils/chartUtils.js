export function renderChart(chartInstance, chartId, transactions, type) {
    if (chartInstance) {
        chartInstance.destroy();
    }

    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.error(`Canvas with ID '${chartId}' not found`);
        return null;
    }
    const ctx = canvas.getContext('2d');

    const currentDate = new Date();
    const filteredTransactions = transactions.filter(transaction => {
        const isPastTransaction = !transaction.isRecurring || new Date(transaction.date) <= currentDate;
        const isNotFutureRecurring = !transaction.isRecurring || !transaction.recurring || new Date(transaction.recurring.nextTransactionDate) <= currentDate;
        return transaction.type === type && isPastTransaction && isNotFutureRecurring;
    });

    const categorySums = {};
    filteredTransactions.forEach(transaction => {
        categorySums[transaction.category] = (categorySums[transaction.category] || 0) + transaction.amount;
    });

    const labels = Object.keys(categorySums);
    const data = Object.values(categorySums);
    console.log("Chart data:", { labels, data, filteredTransactions });

    if (labels.length === 0) {
        console.warn("No data to render chart");
        return null;
    }

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: `Amount ${type === 'expense' ? 'Spent' : 'Earned'}`,
                data: data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
            }]
        }
    });

    return chartInstance;
}