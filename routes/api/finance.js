const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../../middleware/auth');
const User = require('../../models/User');

// Get user's balance and transactions
router.get('/', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        res.json({ balance: user.balance, transactions: user.transactions });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Log an income
router.post('/income', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { method, amount, description } = req.body;
        console.log("method: ", method)
        // Update cash balance
        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        // Update balance based on method
        switch (method) {
            case 'cash':
                user.balance.cash += amount;
                break;
            case 'bank':
                user.balance.bank += amount;
                break;
            default:
                return res.status(400).json({ message: 'Invalid transaction method' });
        }

        // Add transaction
        const transaction = { amount, type: 'income', description };
        user.transactions.push(transaction);

        await user.save();
        res.status(201).json(transaction);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Log an expense
// Log an expense
router.post('/expense', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { method, amount, description } = req.body;

        console.log("Received expense request:", req.body);

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        // Update balance based on method
        switch (method) {
            case 'cash':
                if (user.balance.cash < amount) {
                    return res.status(400).json({ message: 'Insufficient cash balance' });
                }
                user.balance.cash -= amount;
                break;
            case 'bank':
                if (user.balance.bank < amount) {
                    return res.status(400).json({ message: 'Insufficient bank balance' });
                }
                user.balance.bank -= amount;
                break;
            default:
                return res.status(400).json({ message: 'Invalid transaction method' });
        }

        // Add transaction
        const transaction = { amount, method, type: 'expense', description };
        user.transactions.push(transaction);

        await user.save();
        res.status(201).json(transaction);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
