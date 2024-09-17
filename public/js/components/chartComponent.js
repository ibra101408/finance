import { renderChart } from '../utils/chartUtils.js';

export default {
    template: `
      <div class="chart-container mt-5 box p-4">
        <h3 v-if="type === 'expense'">Expense Categories</h3>
        <h3 v-if="type === 'income'">Income Categories</h3>
        <canvas :id="chartId" width="400" height="400"></canvas>
      </div>
    `,
    props: {
        transactions: {
            type: Array,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        chartId: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            chartInstance: null,
        };
    },
    methods: {
        drawChart() {
            if (this.transactions && this.transactions.length > 0) {
                this.chartInstance = renderChart(this.chartInstance, this.chartId, this.transactions, this.type);
            }
        },
    },
    watch: {
        transactions: {
            deep: true,
            handler() {
                this.drawChart();
            },
        },
    },
    mounted() {
        this.drawChart();
    },
    beforeUnmount() {
        if (this.chartInstance) {
            this.chartInstance.destroy(); // Clean up chart instance when the component is destroyed
        }
    },
};