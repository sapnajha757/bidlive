/**
 * Script to remove ALL Edge Case and Test auctions from MongoDB Atlas
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Auction = require('../models/Auction');
const Item = require('../models/Item');
const Bid = require('../models/Bid');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bidlive';

async function removeEdgeCaseAuctions() {
  try {
    const maskUri = (uri) => (uri ? uri.replace(/\/\/(.*?)@/, '//***:***@') : '');
    console.log(`🧹 Connecting to database to remove all Edge Case test auctions: ${maskUri(MONGO_URI)}...`);

    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully.\n');

    // 1. Find all auctions matching 'Edge Case' or 'Test'
    const testAuctions = await Auction.find({
      $or: [
        { title: { $regex: /Edge Case/i } },
        { title: { $regex: /Test Audit/i } },
        { title: { $regex: /^Test/i } }
      ]
    }).lean();

    console.log(`Found ${testAuctions.length} test auctions to delete:`);
    const testAuctionIds = [];
    const testItemIds = [];

    testAuctions.forEach(auc => {
      console.log(`  - ID: ${auc._id} | Title: "${auc.title}"`);
      testAuctionIds.push(auc._id);
      if (auc.itemId) {
        testItemIds.push(auc.itemId);
      }
    });

    if (testAuctionIds.length === 0) {
      console.log('✨ No test auctions found in database!');
    } else {
      // Delete linked bids
      const deletedBids = await Bid.deleteMany({ auctionId: { $in: testAuctionIds } });
      console.log(`\n✅ Deleted Bids: ${deletedBids.deletedCount}`);

      // Delete auctions
      const deletedAuctions = await Auction.deleteMany({ _id: { $in: testAuctionIds } });
      console.log(`✅ Deleted Auctions: ${deletedAuctions.deletedCount}`);

      // Delete linked items
      const deletedItems = await Item.deleteMany({
        $or: [
          { _id: { $in: testItemIds } },
          { name: { $regex: /Edge Case/i } },
          { name: { $regex: /Test Audit/i } },
          { name: { $regex: /^Test/i } }
        ]
      });
      console.log(`✅ Deleted Items: ${deletedItems.deletedCount}`);
    }

    // Verify remaining auctions
    const remainingAuctions = await Auction.find().lean();
    console.log(`\n================ REMAINING AUCTIONS (${remainingAuctions.length}) ================`);
    remainingAuctions.forEach((auc, index) => {
      console.log(`${index + 1}. Title: "${auc.title}" (ID: ${auc._id})`);
    });

    await mongoose.disconnect();
    console.log('\n🎉 Cleanup complete! Refresh your browser to see clean live website.');

  } catch (err) {
    console.error('Cleanup Error:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

removeEdgeCaseAuctions();
