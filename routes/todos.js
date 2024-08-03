const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const User = require('../models/User');

// Get all todos for the logged-in user
router.get('/', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).lean();
        res.json(user.todos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add a new todo
router.post('/', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.todos.push(req.body);

        await user.save();
        res.status(201).json(user.todos[user.todos.length - 1]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update a todo
router.put('/:id', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const todo = user.todos.id(req.params.id);
        if (todo) {
            todo.title = req.body.title;
            todo.description = req.body.description;
            todo.complete = req.body.complete;
            await user.save();
            res.json(todo);
        } else {
            res.status(404).send('Todo not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a todo
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.todos.remove(req.params.id);
        await user.save();
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
