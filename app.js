const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const { setSocketIdForUser, removeSocketIdForUser } = require('./services/socketManager');
const app = express();
const {join} = require("path");
const server = http.createServer(app);
// Set up WebSocket
const io = socketIo(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity, but specify your frontend URL in production
        methods: ['GET', 'POST']
    }
});
const PORT = process.env.PORT || 3000;

dotenv.config();
app.set('view engine', 'ejs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Passport config
require('./config/passport')(passport);
require('./services/cronService');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());
// Express session
app.use(
    session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    })
);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
// Set global var
app.use(function (req, res, next) {
    res.locals.user = req.user || null;
    next();
});
app.use((req, res, next) => {
    req.io = io;
    next();
});
// Routes
app.use(require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/todos', require('./routes/todos'));
app.use('/finance', require('./routes/finance'));
app.use('/friends', require('./routes/friends'));

// Socket.IO connection handler
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
        // Store the socket ID associated with the user ID
        setSocketIdForUser(userId, socket.id);
        // Handle disconnection
        socket.on('disconnect', () => {
            removeSocketIdForUser(userId);
        });

    } else {
        console.error('User ID not provided');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});