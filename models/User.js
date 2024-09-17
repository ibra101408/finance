const mongoose = require('mongoose');

// Define schema for transaction items
const TransactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    method: {
        type: String,
        enum: ['cash', 'bank'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: new Date // Convert ISO string to Date object
    },
    category: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                const categories = this.type === 'income'
                    ? process.env.INCOME_CATEGORIES.split(',')
                    : process.env.EXPENSE_CATEGORIES.split(',');
                return categories.includes(value);
            },
            message: props => `${props.value} is not a valid category for this transaction type!`
        }
    },

    isRecurring: {
        type: Boolean,
        default: false
    },
    recurring: {
        interval: {
            type: String,
            enum: ['minute', 'daily', 'weekly', 'monthly', 'yearly'],
            required: false
        },
        nextTransactionDate: {
            type: Date,
            required: false
        }
    }
});

// Define schema for todo items
const TodoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    complete: {
        type: Boolean,
        default: false
    }
});

// Define schema for friends
const FriendSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
});

// Define schema for users
const UserSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    email: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Reference to the todo items
    todos: [TodoSchema],
    // Finance features
    balance: {
        cash: {
            type: Number,
            default: 0
        },
        bank: {
            type: Number,
            default: 0
        }
    },
    transactions: [TransactionSchema],
    friends: [FriendSchema]

});

module.exports = mongoose.model('User', UserSchema);
