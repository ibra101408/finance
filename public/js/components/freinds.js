import io from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';

export default {
  props: {
    userinfo: {
      type: Object,
      required: true
    }
  },
  template: `
    <div class="container mt-5 box p-4">
      <h3>Add a Friend</h3>
      <input v-model="addFriendEmail" placeholder="Enter friend email"/>
      <button @click="addFriend">Add Friend</button>

      <h3>Delete a Friend</h3>
      <form @submit="deleteFriend">
        <ul>
          <li v-for="friend in filteredAcceptedFriends" :key="friend._id">
            {{ friend.friendId.email }}
            <button @click.prevent="deleteFriend(friend.friendId.email)">Delete Friend</button>
          </li>

        </ul>
      </form>
    </div>
    <div v-for="request in filteredPendingFriendRequests" :key="request._id">
      <span>{{ request.friendId ? request.friendId.displayName : 'Loading...' }} (
        {{ request.friendId ? request.friendId.email : 'Loading...' }})</span>
      <button @click="respondToFriendRequest(request.friendId ? request.friendId._id : null, 'accepted')">Accept
      </button>
      <button @click="respondToFriendRequest(request.friendId ? request.friendId._id : null, 'rejected')">Reject
      </button>

      <div v-if="friendFinance">
        <h3>{{ selectedFriendEmail }}'s Finance</h3>
        <p>Cash: {{ friendFinance.balance?.cash ?? 0 }}</p>
        <p>Bank: {{ friendFinance.balance?.bank ?? 0 }}</p>

        <canvas id="friendFinanceChart"></canvas>
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
