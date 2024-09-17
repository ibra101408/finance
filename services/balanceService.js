// services/balanceService.js
module.exports = {
    updateBalance: function (user, type, method, amount) {
        if (type === 'income') {
            switch (method) {
                case 'cash':
                    user.balance.cash += amount;
                    break;
                case 'bank':
                    user.balance.bank += amount;
                    break;
                default:
                    throw new Error('Invalid transaction method');
            }
        } else if (type === 'expense') {
            switch (method) {
                case 'cash':
                    if (user.balance.cash < amount) {
                        throw new Error('Insufficient cash balance');
                    }
                    user.balance.cash -= amount;
                    break;
                case 'bank':
                    if (user.balance.bank < amount) {
                        throw new Error('Insufficient bank balance');
                    }
                    user.balance.bank -= amount;
                    break;
                default:
                    throw new Error('Invalid transaction method');
            }
        }
    }
};