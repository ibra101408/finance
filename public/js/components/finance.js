export default {
    template: `
      <div class="container mt-5">
        <div class="row gy-5 finance_row">
          <div class="g-col-4 box p-4">
            <h2>Balance</h2>
            <p>Cash: {{ balance?.cash ?? 0 }}</p>
            <p>Bank: {{ balance?.bank ?? 0 }}</p>
          </div>

          <div class="g-col-4 box p-4">
            <h3>Log a Transaction</h3>
            <form @submit="logTransaction">
              <!-- Transaction Form -->
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

        <div class="row gy-5 mt-4">
          <div class="g-col-12 box p-4">
            <h2>Upcoming Recurring Transactions</h2>
            <ul>
              <li v-for="transaction in upcomingRecurringTransactions" :key="transaction._id">
                <strong>{{ capitalize(transaction.type) }}</strong> of
                <strong>{{ transaction.amount }}</strong>
                via <strong>{{ transaction.method }}</strong>
                for <strong>{{ transaction.category }}</strong> -
                "<em>{{ transaction.description }}</em>".
                Next Transaction:
                <strong>{{ new Date(transaction.recurring.nextTransactionDate).toLocaleString() }}</strong>.
              </li>
            </ul>
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
            upcomingRecurringTransactions: [], // Store upcoming recurring transactions here
            transactionType: 'income',
            transactionMethod: 'bank',
            transactionAmount: 0,
            transactionDescription: '',
            transactionCategory: '',
            categories: [],
            isRecurring: false,
            recurringInterval: '',
            nextTransactionDate: '',
            expenseChart: null,
            incomeChart: null
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

                await this.getFinance();

                // Clear the form
                this.transactionAmount = '';
                this.transactionDescription = '';
                this.transactionCategory = '';
                this.transactionType = 'income';
                this.isRecurring = false;
                this.recurringInterval = '';
                this.nextTransactionDate = '';
                this.updateCategories();
            } catch (err) {
                console.error(err);
            }
        },
        async getFinance() {
            try {
                const res = await axios.get('/finance');
                this.balance = res.data.balance;
                this.transactions = res.data.transactions;

                // Filter and store upcoming recurring transactions
                this.upcomingRecurringTransactions = this.transactions.filter(transaction =>
                    transaction.isRecurring && transaction.recurring.nextTransactionDate
                );

                console.log("Filtered upcoming transactions:", this.upcomingRecurringTransactions);
            } catch (err) {
                console.error(err);
            }
        },
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