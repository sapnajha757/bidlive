const Auction = require('../models/Auction');
const User = require('../models/User');

// Helper to initialize Socket.IO connection and rooms
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Join room when user opens an auction page
    socket.on('joinAuction', (auctionId) => {
      if (auctionId) {
        socket.join(`auction:${auctionId}`);
        console.log(`Socket ${socket.id} joined room: auction:${auctionId}`);
      }
    });

    socket.on('joinRoom', (auctionId) => {
      if (auctionId) {
        socket.join(`auction:${auctionId}`);
        console.log(`Socket ${socket.id} joined room: auction:${auctionId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Simple periodic background check for ended auctions (runs every 10 seconds)
  setInterval(async () => {
    try {
      const now = new Date();
      
      // Find auctions whose endTime has passed but status is not marked ENDED
      const expiredAuctions = await Auction.find({
        endTime: { $lte: now },
        status: { $ne: 'ENDED' },
      }).populate('currentWinner', 'name email');

      for (const auction of expiredAuctions) {
        auction.status = 'ENDED';
        await auction.save();

        const winnerInfo = auction.currentWinner
          ? { id: auction.currentWinner._id, name: auction.currentWinner.name, email: auction.currentWinner.email }
          : null;

        console.log(`🏆 Auction ${auction._id} ended. Winner: ${winnerInfo ? winnerInfo.name : 'No bids'}`);

        // Emit auctionEnded event to room
        io.to(`auction:${auction._id}`).emit('auctionEnded', {
          auctionId: auction._id,
          winner: winnerInfo,
          finalBid: auction.currentBid || auction.startingPrice,
          status: 'ENDED',
        });
      }
    } catch (err) {
      console.error('Error checking ended auctions:', err.message);
    }
  }, 10000);
};

module.exports = initSocket;
