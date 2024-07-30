const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../../middleware/auth');
const User = require('../../models/User');



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

        console.log("friendId in back: ", addFriendEmail);
        // Validate that addFriendEmail is provided
        if (!addFriendEmail) {
            return res.status(400).json({ message: 'addFriendEmail is required' });
        }

        // Check if the friend (recipient) exists
        const friend = await User.findOne({ email: addFriendEmail });

        if (!friend) {
            return res.status(404).json({ message: 'Friend not found' });
        }

        const friendId = friend._id;

        console.log("userId in back: ", userId);
        console.log("friendId in back: ", friendId);

        // Check if the friend relationship already exists in the recipient's friends list
        const existingFriend = await User.findOne({
            _id: friendId,
            'friends.friendId': userId,
            'friends.status': { $in: ['accepted', 'pending'] }
        });

        if (existingFriend) {
            console.log("Existing friend:", existingFriend);
            return res.status(400).json({ message: 'Friend already added' });

        }

        // Add the friend request to the recipient's friends list
        await User.findByIdAndUpdate(friendId, {
            $push: {
                friends: {
                    userId: friendId,
                    friendId: userId,
                    status: 'pending'
                }
            }
        });

        res.status(200).json({ message: 'Friend request sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/pending-requests', ensureAuth, async (req, res) => {
    try {
        const userId = req.user._id; // Assuming req.user contains the authenticated user's details

        // Find the user and populate the pending friend requests
        const user = await User.findById(userId).populate({
            path: 'friends',
            match: { status: 'pending' },
            populate: {
                path: 'friendId',
                select: 'displayName email'
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pendingRequests = user.friends.filter(friend => friend.userId.toString() === userId.toString());

        res.status(200).json(pendingRequests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Route to respond to a friend request
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

        // Update the friend request status
        if (status === 'accepted') {
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
        } else if (status === 'rejected') {
            await User.updateOne(
                { _id: userId },
                { $pull: { friends: { friendId: friendId, status: 'pending' } } }
            );
        }
        res.status(200).json({ message: `Friend request ${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get friends' finance data
router.get('/friends-finance', ensureAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'balance transactions username').lean();
        res.json(user.friends);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a friend
router.post('/delete-friend', ensureAuth, async (req, res) => {
    try {
        const { friendEmail } = req.body;
        console.log("Friend Email in delete: ", friendEmail);

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

        res.status(200).json({ message: 'Friend deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


module.exports = router;