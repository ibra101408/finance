// socketManager.js
const userSocketMap = {};

// Function to get a socket ID for a user
function getSocketIdForUser(userId) {
    return userSocketMap[userId] || null;
}

// Function to set a socket ID for a user
function setSocketIdForUser(userId, socketId) {
    userSocketMap[userId] = socketId;
}

// Function to remove a socket ID for a user
function removeSocketIdForUser(userId) {
    delete userSocketMap[userId];
}

module.exports = {
    userSocketMap,
    getSocketIdForUser,
    setSocketIdForUser,
    removeSocketIdForUser
};
