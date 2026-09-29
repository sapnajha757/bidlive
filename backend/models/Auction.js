const mongoose = require('mongoose');

// Schema for Auction entity
const auctionSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumIncrement: {
      type: Number,
      default: 100,
      min: 1,
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    currentWinner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'ENDED'],
      default: 'UPCOMING',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Auction', auctionSchema);
