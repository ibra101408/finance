// services/cronService.js
const cron = require('node-cron');
const User = require('../models/User');
const balanceService = require('./balanceService');

cron.schedule('* * * * *', async () => { // Runs every minute
    try {
        const users = await User.find();

        for (const user of users) {
            const now = new Date();

            const transactionsToProcess = user.transactions.filter(transaction =>
                transaction.isRecurring &&
                transaction.recurring &&
                transaction.recurring.nextTransactionDate <= now
            );

            for (const transaction of transactionsToProcess) {
                // Create a new non-recurring transaction
                const newTransaction = {
                    amount: transaction.amount,
                    type: transaction.type,
                    method: transaction.method,
                    description: transaction.description,
                    category: transaction.category,
                    date: now,
                    isRecurring: false // Set to false for the new transaction
                };

                // Update balance
                balanceService.updateBalance(user, newTransaction.type, newTransaction.method, newTransaction.amount);

                // Add the new non-recurring transaction
                user.transactions.push(newTransaction);

                // Update next transaction date for the original recurring transaction
                const currentDate = new Date(now);
                switch (transaction.recurring.interval) {
                    case 'minute':
                        transaction.recurring.nextTransactionDate = new Date(currentDate.setMinutes(currentDate.getMinutes() + 1));
                        break;
                    case 'daily':
                        transaction.recurring.nextTransactionDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
                        break;
                    case 'weekly':
                        transaction.recurring.nextTransactionDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
                        break;
                    case 'monthly':
                        transaction.recurring.nextTransactionDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
                        break;
                    case 'yearly':
                        transaction.recurring.nextTransactionDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
                        break;
                }
            }

            // Save user only once after processing all transactions
            await user.save();
        }
    } catch (err) {
        console.error('Cron job error:', err);
    }
});

module.exports = cron;