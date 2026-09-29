const mongoose = require('mongoose');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');

// POST /api/auctions/:auctionId/bids - Place a new bid
const placeBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount, requestId } = req.body;
    const userId = req.user.id; // Always use verified token user ID

    // 1. Validate input
    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid bid amount.' });
    }

    // 2. Check for duplicate request using requestId
    if (requestId) {
      const existingBid = await Bid.findOne({ requestId });
      if (existingBid) {
        return res.status(200).json({
          message: 'Request already processed',
          bid: existingBid,
        });
      }
    }

    // 3. Find auction to verify existence and check current server time
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    const now = new Date();
    const start = new Date(auction.startTime);
    const end = new Date(auction.endTime);

    // 4. Server-side auction timing check
    if (now < start) {
      return res.status(400).json({ message: 'Auction has not started yet.' });
    }
    if (now >= end) {
      return res.status(400).json({ message: 'Auction has already ended.' });
    }

    // 5. Calculate minimum valid bid amount
    const currentHighest = auction.currentBid || 0;
    const minIncrement = auction.minimumIncrement || 100;
    const minRequiredBid = currentHighest > 0 ? currentHighest + minIncrement : auction.startingPrice;

    if (numericAmount < minRequiredBid) {
      return res.status(400).json({
        message: `Bid amount must be at least ₹${minRequiredBid} (Current bid ₹${currentHighest} + increment ₹${minIncrement}).`,
      });
    }

    // 6. ATOMIC CONCURRENT BIDDING using findOneAndUpdate
    // Guarantees atomicity and prevents race conditions if multiple users bid simultaneously
    const updatedAuction = await Auction.findOneAndUpdate(
      {
        _id: auctionId,
        startTime: { $lte: now },
        endTime: { $gt: now },
        $or: [
          // Case 1: No bids placed yet (currentBid is 0 or un-set) -> bid must be >= startingPrice
          {
            $and: [
              { $or: [{ currentBid: 0 }, { currentBid: { $exists: false } }] },
              { $expr: { $gte: [numericAmount, '$startingPrice'] } }
            ]
          },
          // Case 2: Bids already exist (currentBid > 0) -> bid must be >= currentBid + minimumIncrement
          {
            $and: [
              { currentBid: { $gt: 0 } },
              {
                $expr: {
                  $gte: [
                    numericAmount,
                    { $add: ['$currentBid', { $ifNull: ['$minimumIncrement', minIncrement] }] }
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        $set: {
          currentBid: numericAmount,
          currentWinner: userId,
          status: 'ACTIVE',
        },
      },
      { new: true }
    );

    // If update returned null, a concurrent bid succeeded first or conditions failed
    if (!updatedAuction) {
      return res.status(400).json({
        message: 'Bid rejected. A higher bid was placed or auction status changed.',
      });
    }

    // 7. Save Bid history record
    const newBid = await Bid.create({
      auctionId,
      userId,
      amount: numericAmount,
      requestId: requestId || null,
    });

    const populatedBid = await Bid.findById(newBid._id).populate('userId', 'name email');

    // 8. Emit Socket.IO real-time event AFTER database commit
    const io = req.app.get('io');
    if (io) {
      const bidderName = req.user.name || (populatedBid.userId ? populatedBid.userId.name : 'Bidder');
      
      io.to(`auction:${auctionId}`).emit('newBid', {
        auctionId,
        amount: numericAmount,
        user: { _id: userId, name: bidderName },
        bidderName: bidderName,
        createdAt: newBid.createdAt,
      });
    }

    return res.status(201).json({
      message: 'Bid placed successfully!',
      bid: populatedBid,
      auction: updatedAuction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to place bid.' });
  }
};

// GET /api/auctions/:auctionId/bids - Get bid history for an auction
const getAuctionBids = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const bids = await Bid.find({ auctionId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(bids);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch bid history.' });
  }
};

// GET /api/users/me/bids - Get bids placed by logged-in user
const getMyBids = async (req, res) => {
  try {
    const userId = req.user.id;

    const myBids = await Bid.find({ userId })
      .populate('auctionId', 'title description imageUrl status startingPrice currentBid endTime')
      .sort({ createdAt: -1 });

    return res.status(200).json(myBids);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch your bids.' });
  }
};

// GET /api/users/me/wins - Get auctions won by logged-in user
const getMyWins = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const wonAuctions = await Auction.find({
      currentWinner: userId,
      $or: [{ endTime: { $lte: now } }, { status: 'ENDED' }],
    }).populate('itemId');

    return res.status(200).json(wonAuctions);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch won auctions.' });
  }
};

module.exports = {
  placeBid,
  getAuctionBids,
  getMyBids,
  getMyWins,
};
