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




// router.post('/transaction')
router.post('/transaction', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { method, amount, description, category, type, interval, isRecurring, nextTransactionDate } = req.body;

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        // Validate category
        const validCategories = type === 'income'
            ? process.env.INCOME_CATEGORIES.split(',')
            : process.env.EXPENSE_CATEGORIES.split(',');
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Calculate nextTransactionDate based on interval
        let calculatedNextTransactionDate = DateTime.now().setZone('Europe/Tallinn');
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

        // Use provided nextTransactionDate if available, otherwise use calculated date
        const finalNextTransactionDate = nextTransactionDate
            ? DateTime.fromISO(nextTransactionDate, { zone: 'Europe/Tallinn' }).toJSDate() // Convert to JS Date object
            : calculatedNextTransactionDate.toJSDate(); // Convert to JS Date object

        // Handle non-recurring transactions immediately
        if (!isRecurring) {
            balanceService.updateBalance(user, type, method, amount);
        } else {
            // For recurring transactions, only apply to balance if the nextTransactionDate is now
            const currentDateTime = DateTime.now().setZone('Europe/Tallinn').toJSDate();
            if (currentDateTime >= finalNextTransactionDate) {
                balanceService.updateBalance(user, type, method, amount);
            }
        }

        // Add transaction
        const transaction = {
            amount,
            type,
            method,
            description,
            category,
            date: DateTime.now().setZone('Europe/Tallinn').toJSDate(), // Convert to JS Date object
            isRecurring,
            recurring: isRecurring && interval ? {
                interval,
                nextTransactionDate: finalNextTransactionDate // Store as JS Date object
            } : undefined
        };

        user.transactions.push(transaction);
        await user.save();
        res.status(201).json(transaction);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
