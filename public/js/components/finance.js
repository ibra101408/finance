export default {
    template:
        `
          <div>
            <h2>Balance</h2>
            <p>Cash: {{ balance.cash }}</p>
            <p>Bank: {{ balance.bank }}</p>

            <h2>Transactions</h2>
            <ul>
              <li v-for="transaction in transactions" :key="transaction._id">
                {{ transaction.date }} - {{ transaction.type }}: {{ transaction.amount }} -
                {{ transaction.description }}
              </li>
            </ul>

            <h3>Log a Transaction</h3>
            <form @submit="logTransaction">
              <label for="type">Type:</label>
              <select v-model="transactionType" required>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <label for="type">Method:</label>
              <select v-model="transactionMethod" required>
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>

              <label for="amount">Amount:</label>
              <input type="number" v-model="transactionAmount" required>

              <label for="description">Description:</label>
              <input type="text" v-model="transactionDescription" required>

              <button type="submit">Submit</button>
            </form>
          </div>
        `,


    data() {
        return {
            balance: {
                cash: 0,
                bank: 0
            },
            transactions: [],
            transactionType: 'income',
            transactionMethod: 'bank',
            transactionAmount: 0,
            transactionDescription: '',
        }
    },
    methods: {
        async logTransaction(event) {
            event.preventDefault(); // Prevent the default form submission behavior

            try {
                const transactionData = {
                    method: this.transactionMethod,
                    amount: parseFloat(this.transactionAmount), // Ensure amount is a number
                    description: this.transactionDescription.trim() // Ensure description is trimmed
                };

                let res;
                switch (this.transactionType) {
                    case 'income':
                        res = await axios.post('/finance/income', transactionData);
                        console.log("Income response:", res);
                        break;
                    case 'expense':
                        res = await axios.post('/finance/expense', transactionData);
                        console.log("Expense response:", res);
                        break;
                    default:
                        console.error("Invalid transaction type");
                        return;
                }

                // Fetch the latest finance data after logging a transaction
                this.getFinance();

                //clear the form
                this.transactionType = 'income'; // or 'expense', depending on your default
                this.transactionAmount = '';
                this.transactionDescription = '';
                console.log("balance", this.balance);
            } catch (err) {
                console.error(err);
            }
        },
        async getFinance() {
            try {
                const res = await axios.get('/finance');
                this.balance = res.data.balance;
                this.transactions = res.data.transactions;
            } catch (err) {
                console.error(err);
            }
        },
    },
    async created() {

        await this.getFinance();

    }
}