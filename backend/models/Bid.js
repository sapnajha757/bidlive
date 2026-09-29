const mongoose = require('mongoose');

// Schema for Bid history entity
const bidSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    requestId: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bid', bidSchema);
