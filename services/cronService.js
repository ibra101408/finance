// services/cronService.js
const cron = require('node-cron');
const User = require('../models/User');
const balanceService = require('./balanceService');
const { DateTime } = require('luxon');

cron.schedule('* * * * *', async () => { // Runs every minute
    console.log('Cron job started at:', new Date().toISOString());

    try {
        const users = await User.find();

        for (const user of users) {
            const now = DateTime.now().setZone('Europe/Tallinn');

            // Filter recurring transactions that are due
            const transactionsToProcess = user.transactions.filter(transaction =>
                transaction.isRecurring &&
                transaction.recurring &&
                DateTime.fromJSDate(transaction.recurring.nextTransactionDate).setZone('Europe/Tallinn') <= now
            );

            for (const transaction of transactionsToProcess) {
                // Create a new transaction based on the recurring template
                const newTransaction = {
                    amount: transaction.amount,
                    type: transaction.type,
                    method: transaction.method,
                    description: transaction.description,
                    category: transaction.category,
                    date: now.toJSDate(),
                    isRecurring: false // The new transaction is not recurring
                };

                // Update the user's balance
                balanceService.updateBalance(user, newTransaction.type, newTransaction.method, newTransaction.amount);

                // Add the new transaction to the user's transaction history
                user.transactions.push(newTransaction);

                // Calculate the next transaction date based on the interval
                let nextTransactionDate = DateTime.fromJSDate(transaction.recurring.nextTransactionDate).setZone('Europe/Tallinn');
                switch (transaction.recurring.interval) {
                    case 'minute':
                        nextTransactionDate = nextTransactionDate.plus({ minutes: 1 });
                        break;
                    case 'daily':
                        nextTransactionDate = nextTransactionDate.plus({ days: 1 });
                        break;
                    case 'weekly':
                        nextTransactionDate = nextTransactionDate.plus({ weeks: 1 });
                        break;
                    case 'monthly':
                        nextTransactionDate = nextTransactionDate.plus({ months: 1 });
                        break;
                    case 'yearly':
                        nextTransactionDate = nextTransactionDate.plus({ years: 1 });
                        break;
                }

                // Update the original recurring transaction's nextTransactionDate
                transaction.recurring.nextTransactionDate = nextTransactionDate.toJSDate();
            }

            // Save the user's updated transactions
            await user.save();
        }
    } catch (err) {
        console.error('Cron job error:', err);
    }
});

module.exports = cron;