export default {
    template: `
      <!--import stylesheet file-->
      <link rel="stylesheet" href="/finance.css">
      <div class="container">
        <div class="row gy-5 finance_row">
          <div class="g-col-4 box p-4">
            <h2>Balance</h2>
            <p>Cash: {{ balance?.cash ?? 0 }}</p>
            <p>Bank: {{ balance?.bank ?? 0 }}</p>
          </div>

          <div class="g-col-4 box p-4">
            <h3>Log a Transaction</h3>
            <form @submit="logTransaction">
              <label for="type">Type:</label>
              <select v-model="transactionType" @change="updateCategories" required>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <label for="method">Method:</label>
              <select v-model="transactionMethod" required>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>

              <label for="amount">Amount:</label>
              <input type="number" v-model="transactionAmount" required>

              <label for="description">Description:</label>
              <input type="text" v-model="transactionDescription" required>

              <label for="category">Category:</label>
              <select v-model="transactionCategory" required>
                <option v-for="category in categories" :value="category" :key="category">{{ category }}</option>
              </select>

              <label for="isRecurring">Recurring:</label>
              <input type="checkbox" v-model="isRecurring">

              <div v-if="isRecurring">
                <label for="interval">Interval:</label>
                <select v-model="recurringInterval" required>
                  <option value="minute">Minute</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>

                <label for="nextTransactionDate">Next Transaction Date:</label>
                <input type="date" v-model="nextTransactionDate" required>
              </div>

              <button type="submit">Submit</button>
            </form>
          </div>

          <div class="g-col-4 box p-4">
            <h2>Transactions</h2>
            <button class="btn btn-primary" @click="showTransactionsModal = true">View Transactions</button>
          </div>
        </div>

        <div class="row gy-5 mt-4">
          <div class="g-col-12 box p-4">
            <h2>Upcoming Recurring Transactions</h2>
            <button class="btn btn-primary" @click="showRecurringModal = true">View Recurring Transactions</button>
          </div>
        </div>

        <!-- Transactions Modal -->
        <div
            class="modal fade"
            :class="{ show: showTransactionsModal, 'd-block': showTransactionsModal }"
            @click.self="showTransactionsModal = false"
        >
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Transactions</h5>
                <button type="button" class="btn-close" @click="showTransactionsModal = false"></button>
              </div>
              <div class="modal-body">
                <ul>
                  <li v-for="transaction in lastFiveTransactions" :key="transaction._id">
                    {{ new Date(transaction.date).toLocaleDateString() }} -
                    {{ transaction.type }}: {{ transaction.amount }} -
                    {{ transaction.description }} ({{ transaction.category }})
                    <span v-if="transaction.isRecurring">
                      (Recurring: {{ transaction.recurring.interval }})
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Upcoming Transactions Modal -->
        <div class="modal fade" 
             :class="{ show: showRecurringModal, 'd-block': showRecurringModal }"             
             @click.self="showRecurringModal = false"
        >
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Upcoming Recurring Transactions</h5>
                <button type="button" class="btn-close" @click="showRecurringModal = false"></button>
              </div>
              <div class="modal-body">
                <ul>
                  <li v-for="transaction in upcomingRecurringTransactions" :key="transaction._id">
                    <strong>{{ capitalize(transaction.type) }}</strong> of
                    <strong>{{ transaction.amount }}</strong>
                    via <strong>{{ transaction.method }}</strong>
                    for <strong>{{ transaction.category }}</strong> -
                    "<em>{{ transaction.description }}</em>".
                    Next Transaction:
                    <strong>{{ new Date(transaction.recurring.nextTransactionDate).toLocaleString() }}</strong>.
                    <button class="btn btn-sm btn-primary" @click="editTransaction(transaction)">Edit</button>
                    <button class="btn btn-sm btn-danger" @click="deleteTransaction(transaction._id)">Delete</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        
        <!-- Edit Recurring Transaction Modal -->
        <div class="modal fade"
             :class="{ show: showEditModal, 'd-block': showEditModal }"
             @click.self="showEditModal = false"
        >
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Edit Recurring Transaction</h5>
                <button type="button" class="btn-close" @click="showEditModal = false"></button>
              </div>
              <div class="modal-body">
                <form @submit.prevent="updateTransaction">
                  <div class="mb-3">
                    <label>Amount</label>
                    <input type="number" v-model="editTransactionData.amount" class="form-control" required />
                  </div>
                  <div class="mb-3">
                    <label>Type</label>
                    <select v-model="editTransactionData.type" class="form-control">
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label>Method</label>
                    <select v-model="editTransactionData.method" class="form-control">
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label>Category</label>
                    <input type="text" v-model="editTransactionData.category" class="form-control" required />
                  </div>
                  <div class="mb-3">
                    <label>Interval</label>
                    <select v-model="editTransactionData.recurring.interval" class="form-control">
                      <option value="minute">Minute</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label>Next Transaction Date</label>
                    <input type="datetime-local" v-model="editTransactionData.recurring.nextTransactionDate" class="form-control" required />
                  </div>
                  <button type="submit" class="btn btn-primary">Save Changes</button>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    `,

    data() {
        return {
            balance: {
                cash: 0,
                bank: 0
            },
            transactions: [],
            upcomingRecurringTransactions: [],
            transactionType: 'income',
            transactionMethod: 'bank',
            transactionAmount: 0,
            transactionDescription: '',
            transactionCategory: '',
            categories: [],
            isRecurring: false,
            recurringInterval: '',
            nextTransactionDate: '',
            showTransactionsModal: false,
            showRecurringModal: false,
            showEditModal: false,
            editTransactionData: {
                _id: '',
                amount: 0,
                type: 'income',
                method: 'bank',
                category: '',
                isRecurring: false,
                recurring: {
                    interval: '',
                    nextTransactionDate: ''
                }
            }
        }
    },

    methods: {
        capitalize(word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        },
        async updateCategories() {
            try {
                const response = await axios.get(`/finance/categories?type=${this.transactionType}`);
                this.categories = response.data.categories;
            } catch (err) {
                console.error("Error fetching categories:", err);
            }
        },
        async logTransaction(event) {
            event.preventDefault();
            try {
                const transactionData = {
                    method: this.transactionMethod,
                    amount: parseFloat(this.transactionAmount),
                    description: this.transactionDescription.trim(),
                    category: this.transactionCategory,
                    type: this.transactionType,
                    isRecurring: this.isRecurring,
                    interval: this.recurringInterval,
                    nextTransactionDate: this.nextTransactionDate
                };
                const res = await axios.post('/finance/transaction', transactionData);
                console.log("Transaction response:", res);
                // Clear the form
                this.transactionAmount = '';
                this.transactionDescription = '';
                this.transactionCategory = '';
                this.transactionType = 'income';
                this.transactionMethod = 'bank';
                this.isRecurring = false;
                this.recurringInterval = '';
                this.nextTransactionDate = '';

                await this.getFinance();
            } catch (err) {
                console.error(err);
            }
        },
        async getFinance() {
            try {
                const res = await axios.get('/finance');
                this.balance = res.data.balance;
                this.transactions = res.data.transactions;
                this.upcomingRecurringTransactions = this.transactions.filter(transaction => transaction.isRecurring);
            } catch (err) {
                console.error(err);
            }
        },
        toggleBodyScroll(disable) {
            if (disable) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        },
        editTransaction(transaction) {
            this.editTransactionData = { ...transaction };
            this.showEditModal = true;
        },
        async updateTransaction() {
            try {
                await axios.put(`/finance/transaction/${this.editTransactionData._id}`, this.editTransactionData);
                this.showEditModal = false;
                await this.getFinance(); // Refresh transactions
            } catch (err) {
                console.error(err);
            }
        },
        async deleteTransaction(transactionId) {
            if (!confirm("Are you sure you want to delete this transaction?")) return;
            try {
                await axios.delete(`/finance/transaction/${transactionId}`);
                await this.getFinance(); // Refresh transactions
            } catch (err) {
                console.error(err);
            }
        }
    },
    watch: {
        showTransactionsModal(newValue) {
            this.toggleBodyScroll(newValue);
        },
        showRecurringModal(newValue) {
            this.toggleBodyScroll(newValue);
        }
    },
    async created() {
        this.updateCategories();
        await this.getFinance();
    },
    computed: {
        lastFiveTransactions() {
            return this.transactions.slice(-5).reverse();
        },
    }
}
