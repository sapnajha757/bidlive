/**
 * Read-Only Database Audit Script for BidLive
 * Inspects MongoDB Atlas records to classify test vs demo data.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Auction = require('../models/Auction');
const User = require('../models/User');
const Bid = require('../models/Bid');
const Item = require('../models/Item');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bidlive';

async function inspectDatabase() {
  try {
    const maskUri = (uri) => (uri ? uri.replace(/\/\/(.*?)@/, '//***:***@') : '');
    console.log(`🔍 Connecting to database for READ-ONLY inspection: ${maskUri(MONGO_URI)}...`);

    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully.\n');

    // 1. Inspect Auctions
    const auctions = await Auction.find().lean();
    console.log(`================ ALL AUCTIONS (${auctions.length}) ================`);
    auctions.forEach((auc, index) => {
      console.log(`${index + 1}. ID: ${auc._id}`);
      console.log(`   Title: "${auc.title}"`);
      console.log(`   Starting Price: ₹${auc.startingPrice} | Current Bid: ₹${auc.currentBid}`);
      console.log(`   Status: ${auc.status} | Created: ${auc.createdAt}`);
      console.log('--------------------------------------------------');
    });

    // 2. Inspect Test Users vs Demo Users
    const users = await User.find().lean();
    const testUsers = users.filter(u => u.email.includes('bidderA') || u.email.includes('bidderB') || u.email.includes('audit_bidder') || u.email.includes('edgeA') || u.email.includes('edgeB'));
    const demoUsers = users.filter(u => !u.email.includes('bidderA') && !u.email.includes('bidderB') && !u.email.includes('audit_bidder') && !u.email.includes('edgeA') && !u.email.includes('edgeB'));

    console.log(`\n================ ALL USERS (${users.length}) ================`);
    console.log(`- Demo / Seed Users: ${demoUsers.length}`);
    console.log(`- Automated Test Users: ${testUsers.length}`);

    // 3. Inspect Bids
    const bids = await Bid.find().lean();
    console.log(`\n================ TOTAL BIDS: ${bids.length} =================\n`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Inspection Error:', err.message);
  }
}

inspectDatabase();
