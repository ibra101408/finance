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
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// Passport config
require('./config/passport')(passport);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors());

app.set('view engine', 'ejs');

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

// Create HTTP server
const server = http.createServer(app);

// Set up WebSocket
const io = socketIo(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity, but specify your frontend URL in production
        methods: ['GET', 'POST']
    }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
        // Store the socket ID associated with the user ID
        setSocketIdForUser(userId, socket.id);
        /*console.log('Connected:', {
            socketId: socket.id,
            userId: userId
        });*/

        // Handle disconnection
        socket.on('disconnect', () => {
           /*console.log('Disconnected:', {
                socketId: socket.id,
                userId: userId
            });*/
            removeSocketIdForUser(userId);
        });

    } else {
        console.error('User ID not provided');
    }
});

// Routes
app.use(require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/todos', require('./routes/todos'));
app.use('/finance', require('./routes/finance'));
app.use('/friends', require('./routes/friends'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});