const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const User = require('../models/User');
const { getSocketIdForUser } = require('../services/socketManager');

// get all friends
router.get('/all-friends', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'friends.friendId',
            select: 'email'
        }).lean();

        res.json(user.friends);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');

    }
});

// Add friend route
router.post('/add-friend', ensureAuth, async (req, res) => {
    try {
        const { addFriendEmail } = req.body;
        const userId = req.user._id; // Assuming req.user contains the authenticated user's details
        const userEmail = req.user.email; // Assuming req.user contains the authenticated user's details

        if (!addFriendEmail) {
            return res.status(400).json({ message: 'addFriendEmail is required' });
        }

        const friend = await User.findOne({ email: addFriendEmail });

        if (!friend) {
            return res.status(404).json({ message: 'Friend not found' });
        }

        const friendId = friend._id;

        if (friend._id.equals(userId)) {
            return res.status(400).json({message: "You cannot add yourself as a friend"});
        }

        const existingFriend = await User.findOne({
            _id: friendId,
            'friends.friendId': userId,
            'friends.status': {$in: ['accepted', 'pending']}
        });

        if (existingFriend) {
            console.log("Existing friend:", existingFriend);
            return res.status(400).json({message: 'Friend already added'});
        }

        await User.findByIdAndUpdate(friendId, {
            $push: {
                friends: {
                    userId: friendId,
                    friendId: userId,
                    status: 'pending'
                }
            }
        });

        // Get the recipient's socket ID
        const recipientSocketId = getSocketIdForUser(friendId);

        // Emit an event to notify the recipient about the new friend request
        if (recipientSocketId) {
            req.io.to(recipientSocketId).emit('newPendingRequest', {
                friendId: {
                    _id: userId,
                    email: userEmail,
                    displayName: req.user.displayName // Ensure displayName is included if necessary
                },
                status: 'pending'
            });
        }

        res.status(200).json({message: 'Friend request sent'});
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server Error'});
    }
});


router.get('/pending-requests', ensureAuth, async (req, res) => {
    try {
        const userId = req.user._id; // Assuming req.user contains the authenticated user's details

        // Find the user and populate the pending friend requests
        const user = await User.findById(userId).populate({
            path: 'friends',
            match: {status: 'pending'},
            populate: {
                path: 'friendId',
                select: 'displayName email'
            }
        });

        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        const pendingRequests = user.friends.filter(friend => friend.userId.toString() === userId.toString());

        res.status(200).json(pendingRequests);
    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Server Error'});
    }
});

router.post('/respond-friend-request', ensureAuth, async (req, res) => {
    try {
        const { friendId, status } = req.body;
        const userId = req.user._id; // Assuming req.user contains the authenticated user's details

        // Validate that both friendId and status are provided
        if (!friendId || !status) {
            return res.status(400).json({ message: 'Both friendId and status are required' });
        }

        // Validate the status
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find the friend request
        const friendRequest = await User.findOne({
            _id: userId,
            'friends.friendId': friendId,
            'friends.status': 'pending'
        });

        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }

        if (status === 'accepted') {
            // Update the friend request status to accepted
            await User.updateOne(
                { _id: userId, 'friends.friendId': friendId },
                { $set: { 'friends.$.status': status } }
            );

            await User.findByIdAndUpdate(friendId, {
                $push: {
                    friends: {
                        userId: friendId,
                        friendId: userId,
                        status: 'accepted'
                    }
                }
            });

            // Fetch the updated user data to emit the correct structure
            const updatedFriend = await User.findById(userId).populate('friends.friendId', 'email');
            const updatedData = updatedFriend.friends.find(friend => friend.friendId._id.equals(friendId));

            // Emit an event to notify both users about the accepted friend request
            const recipientSocketId = getSocketIdForUser(friendId);
            const senderSocketId = getSocketIdForUser(userId);

            if (recipientSocketId) {
                req.io.to(recipientSocketId).emit('friendRequestUpdated', {
                    friendId: {
                        _id: userId,
                        email: req.user.email,
                        displayName: req.user.displayName
                    },
                    status: 'accepted'
                });
            }

            if (senderSocketId) {
                req.io.to(senderSocketId).emit('friendRequestUpdated', {
                    friendId: {
                        _id: friendId,
                        email: updatedData.friendId.email,
                        displayName: updatedData.friendId.displayName
                    },
                    status: 'accepted'
                });
            }
        } else if (status === 'rejected') {
            // Remove the friend request from the user's friends list
            await User.updateOne(
                { _id: userId },
                { $pull: { friends: { friendId: friendId, status: 'pending' } } }
            );

            // Emit an event to notify the recipient about the rejected friend request
            const recipientSocketId = getSocketIdForUser(friendId);
            const senderSocketId = getSocketIdForUser(userId);

            if (recipientSocketId) {
                req.io.to(recipientSocketId).emit('friendRequestUpdated', {
                    friendId: { _id: friendId },
                    status: 'rejected',
                    userId: userId
                });
            }

            if (senderSocketId) {
                req.io.to(senderSocketId).emit('friendRequestUpdated', {
                    friendId: { _id: friendId },
                    status: 'rejected',
                    userId: userId
                });
            }
        }

        res.status(200).json({ message: `Friend request ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.post('/delete-friend', ensureAuth, async (req, res) => {
    try {
        const { friendEmail } = req.body;

        // Find the friend by email
        const friend = await User.findOne({ email: friendEmail });
        if (!friend) {
            return res.status(404).json({ message: 'Friend not found' });
        }

        // Get the current user
        const user = await User.findById(req.user._id);

        // Find the friend entry in the user's friends list
        const friendEntry = user.friends.find(
            f => f.friendId.toString() === friend._id.toString() && f.status === 'accepted'
        );

        if (!friendEntry) {
            return res.status(404).json({ message: 'Friend not found in your list' });
        }

        // Remove the friend entry
        user.friends = user.friends.filter(
            f => f.friendId.toString() !== friend._id.toString() || f.status !== 'accepted'
        );

        // Save the user
        await user.save();

        // Also remove the current user from the friend's friend list
        const friendUser = await User.findById(friend._id);
        friendUser.friends = friendUser.friends.filter(
            f => f.friendId.toString() !== user._id.toString() || f.status !== 'accepted'
        );

        // Save the friend
        await friendUser.save();

        // Emit an event to notify both users about the deleted friend
        const userSocketId = getSocketIdForUser(user._id);
        const friendSocketId = getSocketIdForUser(friend._id);

        if (userSocketId) {
            req.io.to(userSocketId).emit('friendDeleted', {
                userId: req.user._id,
                friendId: friend._id
            });
            console.log("Friend deleted2:", userSocketId);
        }

        if (friendSocketId) {
            req.io.to(friendSocketId).emit('friendDeleted', {
                userId: req.user._id,
                friendId: friend._id
            });
            console.log("Friend deleted1:", friendSocketId);
        }

        res.status(200).json({ message: 'Friend deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/friend-finance/:friendId', ensureAuth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { friendId } = req.params;

        // Check if the users are friends and populate friend's name
        const user = await User.findOne({
            _id: userId,
            'friends.friendId': friendId,
            'friends.status': 'accepted'
        }).populate('friends.friendId', 'displayName');

        if (!user) {
            return res.status(403).json({ message: 'You are not friends with this user' });
        }

        // Fetch the friend's finance data
        const friend = await User.findById(friendId)
            .select('displayName balance transactions')
            .lean();

        if (!friend) {
            return res.status(404).json({ message: 'Friend not found' });
        }

        res.json({
            finance: {
                balance: friend.balance,
                transactions: friend.transactions
            },
            displayName: friend.displayName // ✅ Now guaranteed to have the friend's name
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;


