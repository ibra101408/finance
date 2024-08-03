const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

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
    console.log('A user connected');

    // Handle incoming messages from clients
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('sendMessage', (message) => {
        // Broadcast the message to all connected clients
        io.emit('receiveMessage', message);
    });

    socket.on('privateMessage', (message) => {
        io.to(message.targetSocketId).emit('receiveMessage', message.content);
    });
});

// Routes
app.use(require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/api/todos', require('./routes/api/todos'));
app.use('/api/finance', require('./routes/api/finance'));
app.use('/api/friends', require('./routes/api/friends'));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});