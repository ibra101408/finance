import io from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

export default {
  props: {
    userinfo: {
      type: Object,
      required: true
    }
  },
    template: `
    <div class="container block p-4">
      <h3 class="mb-3 text-primary">Add a Friend</h3>
      <div class="d-flex gap-2">
        <input v-model="addFriendEmail" class="form-control" placeholder="Enter friend email"/>
        <button class="btn btn-primary" @click="addFriend">Add Friend</button>
      </div>

      <h3 class="mt-4 mb-3 text-danger">Delete a Friend</h3>
      <form @submit="deleteFriend">
        <ul class="friends-list list-group">
          <li v-for="friend in filteredAcceptedFriends" :key="friend._id" class="list-group-item d-flex justify-content-between align-items-center">
            {{ friend.friendId.email }}
            <button class="btn btn-outline-danger btn-sm" @click.prevent="deleteFriend(friend.friendId.email)">Delete</button>
          </li>
        </ul>
      </form>
    </div>

    <h3 class="mt-4 mb-3 text-info">Friend Requests</h3>
    <div v-for="request in filteredPendingFriendRequests" :key="request._id" class="block p-3 mb-2">
      <span class="fw-bold">
        {{ request.friendId ? request.friendId.displayName : 'Loading...' }} (
        {{ request.friendId ? request.friendId.email : 'Loading...' }})
      </span>
      <div class="mt-2 d-flex gap-2">
        <button class="btn btn-success" @click="respondToFriendRequest(request.friendId ? request.friendId._id : null, 'accepted')">Accept</button>
        <button class="btn btn-danger" @click="respondToFriendRequest(request.friendId ? request.friendId._id : null, 'rejected')">Reject</button>
      </div>

      <div v-if="friendFinance" class="mt-4">
        <h3 class="text-secondary">{{ selectedFriendEmail }}'s Finance</h3>
        <p><strong>Cash:</strong> {{ friendFinance.balance?.cash ?? 0 }}</p>
        <p><strong>Bank:</strong> {{ friendFinance.balance?.bank ?? 0 }}</p>

        <div class="chart-container">
          <canvas id="friendFinanceChart"></canvas>
        </div>
      </div>
    </div>
  `,



  data() {
    return {
      friendId: '',
      friends: [],
      friendEmail: '', // Updated to use email instead of ID
      addFriendEmail: '', // Updated to use email instead of ID
      pendingFriendRequests: [],
      socket: null, // Add socket property

    };
  },
  computed: {
    filteredPendingFriendRequests() {
      return this.pendingFriendRequests.filter(request => request.status === 'pending');
    },
    filteredAcceptedFriends() {
      return this.friends.filter(friend => friend.status === 'accepted');
    }
  },
  methods: {
    async addFriend() {
      try {
        await axios.post('/friends/add-friend', {addFriendEmail: this.addFriendEmail});
        this.addFriendEmail = '';
        this.fetchPendingRequests();
        console.log("is something happening?", this.addFriendEmail);
      } catch (error) {
        console.error(error);
      }
    },

    async fetchPendingRequests() {
      try {
        const response = await axios.get('/friends/pending-requests');
        this.pendingFriendRequests = response.data;
      } catch (error) {
        console.error(error.response.data.message);
      }
    },

    async respondToFriendRequest(friendId, status) {
      if (!friendId) {
        console.error('Friend ID is undefined');
        return;
      }
      try {
        await axios.post('/friends/respond-friend-request', {friendId, status});
        this.pendingFriendRequests = this.pendingFriendRequests.filter(request => request.friendId._id !== friendId);
      } catch (error) {
        console.error(error);
      }
    },

    async deleteFriend(friendEmail) {
      try {
        const response = await fetch('/friends/delete-friend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ friendEmail })
        });
        const result = await response.json();
        if (result.message === 'Friend deleted successfully') {
          this.friends = this.friends.filter(friend => friend.friendId.email !== friendEmail);
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error('Error deleting friend:', error);
      }
    },
    async getFriends() {
      try {
        const response = await axios.get('/friends/all-friends');
        this.friends = response.data;
      } catch (error) {
        console.error(error);
      }
    }
  },

  async created() {
    await this.getFriends();
    await this.fetchPendingRequests();
  },

  mounted() {
    // Initialize WebSocket connection with user ID
    console.log("userinfo", this.userinfo);
    const userId = this.userinfo._id; // Replace with the actual way you access the user ID in your Vue component
    this.socket = io('http://localhost:3000', { query: { userId } });

    // Listen for connection event
    this.socket.on('connect', () => {
      console.log('Connected to the server');
    });

    // Listen for disconnection event
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Listen for new pending requests from the server
    this.socket.on('newPendingRequest', (data) => {
      this.pendingFriendRequests.push(data);  // Update the list with the new request
    });

    // Listen for friend request updates from the server
    this.socket.on('friendRequestUpdated', (data) => {
      this.friends.push(data);  // Update the list with the new request
    });

    // Listen for friend deletions
    this.socket.on('friendDeleted', (data) => {
      this.friends = this.friends.filter(friend => friend.friendId._id !== data.friendId);
    });

    // Emit a test event to verify connection
    this.socket.emit('testConnection', 'Hello server');

    // Fetch initial pending requests
    this.fetchPendingRequests();
  },
};
