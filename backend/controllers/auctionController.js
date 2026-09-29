const Auction = require('../models/Auction');
const Item = require('../models/Item');

// Helper function to calculate real-time auction status based on server time
const calculateStatus = (auction) => {
  const now = new Date();
  const start = new Date(auction.startTime);
  const end = new Date(auction.endTime);

  if (now < start) return 'UPCOMING';
  if (now >= end) return 'ENDED';
  return 'ACTIVE';
};

// GET /api/auctions - Retrieve all auctions
const getAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find()
      .populate('itemId')
      .populate('currentWinner', 'name email')
      .sort({ createdAt: -1 });

    // Dynamically calculate and update status for each auction
    const updatedAuctions = auctions.map((auc) => {
      const liveStatus = calculateStatus(auc);
      const aucObj = auc.toObject();
      aucObj.status = liveStatus;
      return aucObj;
    });

    return res.status(200).json(updatedAuctions);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch auctions.' });
  }
};

// GET /api/auctions/:id - Retrieve single auction by ID
const getAuctionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid auction ID format.' });
    }

    const auction = await Auction.findById(req.params.id)
      .populate('itemId')
      .populate('currentWinner', 'name email');

    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    const aucObj = auction.toObject();
    aucObj.status = calculateStatus(auction);

    return res.status(200).json(aucObj);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch auction details.' });
  }
};

// POST /api/auctions - Create a new auction (Admin only)
const createAuction = async (req, res) => {
  try {
    const {
      title,
      name,
      description,
      imageUrl,
      image,
      startingBid,
      startingPrice,
      minimumIncrement,
      startTime,
      endTime,
    } = req.body;

    const auctionTitle = title || name;
    const price = startingPrice !== undefined ? startingPrice : startingBid;
    const img = imageUrl || image || '';

    if (!auctionTitle || price === undefined || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, starting price, start time, and end time are required.' });
    }

    // 1. Create linked Item document
    const newItem = await Item.create({
      name: auctionTitle,
      description: description || '',
      image: img,
    });

    // 2. Create Auction document
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    let initialStatus = 'UPCOMING';
    if (now >= start && now < end) initialStatus = 'ACTIVE';
    if (now >= end) initialStatus = 'ENDED';

    const newAuction = await Auction.create({
      itemId: newItem._id,
      title: auctionTitle,
      description: description || '',
      imageUrl: img,
      startingPrice: Number(price),
      currentBid: Number(price),
      minimumIncrement: Number(minimumIncrement || 100),
      startTime: start,
      endTime: end,
      status: initialStatus,
    });

    const populatedAuction = await Auction.findById(newAuction._id).populate('itemId');

    return res.status(201).json({
      message: 'Auction created successfully',
      auction: populatedAuction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create auction.' });
  }
};

// PUT /api/auctions/:id - Update existing auction (Admin only)
const updateAuction = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid auction ID format.' });
    }

    const {
      title,
      name,
      description,
      imageUrl,
      image,
      startingPrice,
      startingBid,
      minimumIncrement,
      startTime,
      endTime,
    } = req.body;

    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found.' });
    }

    if (title || name) auction.title = title || name;
    if (description !== undefined) auction.description = description;
    if (imageUrl || image) auction.imageUrl = imageUrl || image;
    if (startingPrice !== undefined || startingBid !== undefined) {
      const newPrice = Number(startingPrice !== undefined ? startingPrice : startingBid);
      auction.startingPrice = newPrice;

      // If no bids have been placed yet (currentWinner is null), sync currentBid to new startingPrice
      if (!auction.currentWinner) {
        auction.currentBid = newPrice;
      }
    }
    if (minimumIncrement !== undefined) auction.minimumIncrement = Number(minimumIncrement);
    if (startTime) auction.startTime = new Date(startTime);
    if (endTime) auction.endTime = new Date(endTime);

    // Recalculate status
    auction.status = calculateStatus(auction);

    await auction.save();

    // Also update linked Item if present
    if (auction.itemId) {
      await Item.findByIdAndUpdate(auction.itemId, {
        name: auction.title,
        description: auction.description,
        image: auction.imageUrl,
      });
    }

    const updatedAuction = await Auction.findById(auction._id).populate('itemId');

    return res.status(200).json({
      message: 'Auction updated successfully',
      auction: updatedAuction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update auction.' });
  }
};

module.exports = {
  getAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  calculateStatus,
};
