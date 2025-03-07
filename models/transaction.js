const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide sender']
  },
  receiver: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide receiver']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide amount'],
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  transactionType: {
    type: String,
    enum: ['transfer', 'deposit', 'withdrawal'],
    required: true
  },
  description: {
    type: String,
    maxlength: 100
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);