const express = require('express');
const router = express.Router();
const {ensureAuth} = require('../middleware/auth');
const User = require('../models/User');
const cors = require('cors');
const dotenv = require('dotenv');
const balanceService = require('../services/balanceService');
const { DateTime } = require('luxon');

router.use(cors()); // Enable CORS for all routes

dotenv.config(); // Load environment variables from .env file

// Get user's balance and transactions
router.get('/', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        res.json({balance: user.balance, transactions: user.transactions});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/categories', (req, res) => {
    const type = req.query.type;
    let categories;
    switch (type) {
        case 'income':
            categories = process.env.INCOME_CATEGORIES.split(',');
            break;
        case 'expense':
            categories = process.env.EXPENSE_CATEGORIES.split(',');
            break;
        default:
            return res.status(400).json({error: 'Invalid transaction type'});
    }

    res.json({categories});
});

router.post('/transaction', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { method, amount, description, category, type, interval, isRecurring, nextTransactionDate } = req.body;

        // Validate the amount
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        // Validate the category
        const validCategories = type === 'income'
            ? process.env.INCOME_CATEGORIES.split(',')
            : process.env.EXPENSE_CATEGORIES.split(',');
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Calculate the next transaction date
        let calculatedNextTransactionDate = nextTransactionDate
            ? DateTime.fromISO(nextTransactionDate, { zone: 'Europe/Tallinn' }).set({
                hour: DateTime.now().hour,
                minute: DateTime.now().minute,
                second: DateTime.now().second
            })
            : DateTime.now().setZone('Europe/Tallinn');

        if (isRecurring && interval) {
            switch (interval) {
                case 'minute':
                    calculatedNextTransactionDate = calculatedNextTransactionDate.plus({ minutes: 1 });
                    break;
                case 'daily':
                    calculatedNextTransactionDate = calculatedNextTransactionDate.plus({ days: 1 });
                    break;
                case 'weekly':
                    calculatedNextTransactionDate = calculatedNextTransactionDate.plus({ weeks: 1 });
                    break;
                case 'monthly':
                    calculatedNextTransactionDate = calculatedNextTransactionDate.plus({ months: 1 });
                    break;
                case 'yearly':
                    calculatedNextTransactionDate = calculatedNextTransactionDate.plus({ years: 1 });
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid interval' });
            }
        }

        // Create the transaction
        const transaction = {
            amount,
            type,
            method,
            description,
            category,
            date: DateTime.now().setZone('Europe/Tallinn').toJSDate(),
            isRecurring,
            recurring: isRecurring && interval
                ? {
                    interval,
                    nextTransactionDate: calculatedNextTransactionDate.toJSDate()
                }
                : undefined
        };

        // Handle non-recurring transactions immediately
        if (!isRecurring) {
            balanceService.updateBalance(user, type, method, amount);
        }

        // Save the transaction
        user.transactions.push(transaction);
        await user.save();

        res.status(201).json(transaction);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.put('/transaction/:transactionId', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const transaction = user.transactions.id(req.params.transactionId);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const { amount, type, method, description, category, isRecurring, interval, nextTransactionDate } = req.body;

        transaction.amount = amount ?? transaction.amount;
        transaction.type = type ?? transaction.type;
        transaction.method = method ?? transaction.method;
        transaction.description = description ?? transaction.description;
        transaction.category = category ?? transaction.category;
        transaction.isRecurring = isRecurring ?? transaction.isRecurring;

        if (isRecurring) {
            transaction.recurring.interval = interval ?? transaction.recurring.interval;
            transaction.recurring.nextTransactionDate = nextTransactionDate ? new Date(nextTransactionDate) : transaction.recurring.nextTransactionDate;
        } else {
            transaction.recurring = undefined;
        }

        await user.save();
        res.json(transaction);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.delete('/transaction/:transactionId', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.transactions = user.transactions.filter(transaction => transaction._id.toString() !== req.params.transactionId);
        await user.save();
        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
