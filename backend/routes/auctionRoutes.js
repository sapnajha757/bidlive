const express = require('express');
const router = express.Router();
const {
  getAuctions,
  getAdminStats,
  getAuctionById,
  createAuction,
  updateAuction,
} = require('../controllers/auctionController');
const {
  placeBid,
  getAuctionBids,
} = require('../controllers/bidController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public auction endpoints
router.get('/', getAuctions);

// Admin stats endpoint (MUST be declared before /:id)
router.get('/stats', authMiddleware, adminMiddleware, getAdminStats);

router.get('/:id', getAuctionById);
router.get('/:auctionId/bids', getAuctionBids);

// Bidding endpoint
router.post('/:auctionId/bids', authMiddleware, placeBid);

// Admin endpoints
router.post('/', authMiddleware, adminMiddleware, createAuction);
router.put('/:id', authMiddleware, adminMiddleware, updateAuction);

module.exports = router;
