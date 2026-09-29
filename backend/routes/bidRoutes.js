const express = require('express');
const router = express.Router();
const {
  placeBid,
  getAuctionBids,
  getMyBids,
  getMyWins,
} = require('../controllers/bidController');
const authMiddleware = require('../middleware/authMiddleware');

// User bids and wins endpoints (mounted on /api/users/me)
router.get('/me/bids', authMiddleware, getMyBids);
router.get('/me/wins', authMiddleware, getMyWins);

module.exports = router;
