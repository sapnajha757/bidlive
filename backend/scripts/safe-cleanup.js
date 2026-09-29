/**
 * Safe Targeted Cleanup Script for MongoDB Atlas Test Artifacts
 * 
 * Strict Scope:
 * - Auctions: 6abb878dd91a8a2e916e19ec, 6abb8908d91a8a2e916e19f2, 6abb8908d91a8a2e916e19f4
 * - Users: audit_bidder_1790674829377@test.com, edgeB_1790675208581@test.com
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Auction = require('../models/Auction');
const User = require('../models/User');
const Bid = require('../models/Bid');
const Item = require('../models/Item');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bidlive';

const TARGET_AUCTION_IDS = [
  '6abb878dd91a8a2e916e19ec',
  '6abb8908d91a8a2e916e19f2',
  '6abb8908d91a8a2e916e19f4'
];

const TARGET_USER_EMAILS = [
  'audit_bidder_1790674829377@test.com',
  'edgeB_1790675208581@test.com'
];

async function executeSafeCleanup() {
  try {
    const maskUri = (uri) => (uri ? uri.replace(/\/\/(.*?)@/, '//***:***@') : '');
    console.log(`🔒 Connecting to MongoDB Atlas for Safe Targeted Cleanup: ${maskUri(MONGO_URI)}...`);

    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected successfully.\n');

    // -------------------------------------------------------------
    // STEP 1: PRE-DELETION VERIFICATION & EXPORT BACKUP
    // -------------------------------------------------------------
    console.log('================ STEP 1: PRE-DELETION VERIFICATION ================');

    // 1.1 Verify Target Auctions
    const targetAuctions = await Auction.find({ _id: { $in: TARGET_AUCTION_IDS } }).lean();
    if (targetAuctions.length !== 3) {
      throw new Error(`Expected exactly 3 target auctions, found ${targetAuctions.length}. Aborting for safety.`);
    }

    console.log(`Found ${targetAuctions.length} Target Auctions to Delete:`);
    const targetItemIds = [];
    targetAuctions.forEach(auc => {
      console.log(`  - ID: ${auc._id} | Title: "${auc.title}"`);
      if (!auc.title.includes('Test Audit Item') && !auc.title.includes('Edge Case')) {
        throw new Error(`Safety Violation: Auction ${auc._id} title "${auc.title}" is not a recognized test title! Aborting.`);
      }
      if (auc.itemId) {
        targetItemIds.push(auc.itemId.toString());
      }
    });

    // 1.2 Verify Target Items
    const targetItems = await Item.find({ _id: { $in: targetItemIds } }).lean();
    console.log(`\nFound ${targetItems.length} Linked Items to Delete:`);
    targetItems.forEach(item => {
      console.log(`  - Item ID: ${item._id} | Name: "${item.name}"`);
    });

    // 1.3 Verify Target Bids
    const targetBids = await Bid.find({ auctionId: { $in: TARGET_AUCTION_IDS } }).lean();
    console.log(`\nFound ${targetBids.length} Target Bids to Delete:`);
    targetBids.forEach((b, i) => {
      console.log(`  - Bid ${i+1}: ID: ${b._id} | Auction: ${b.auctionId} | Amount: ₹${b.amount}`);
    });

    // 1.4 Verify Target Users
    const targetUsers = await User.find({ email: { $in: TARGET_USER_EMAILS } }).lean();
    if (targetUsers.length !== 2) {
      console.warn(`Warning: Expected 2 target users, found ${targetUsers.length}. Checking emails...`);
    }
    console.log(`\nFound ${targetUsers.length} Target Users to Delete by Exact Email:`);
    const targetUserIds = [];
    targetUsers.forEach(u => {
      console.log(`  - User ID: ${u._id} | Email: "${u.email}" | Name: "${u.name}"`);
      targetUserIds.push(u._id.toString());
    });

    // 1.5 Verify Target Users have NO bids on Genuine Auctions
    const genuineAuctions = await Auction.find({ _id: { $nin: TARGET_AUCTION_IDS } }).lean();
    const genuineAuctionIds = genuineAuctions.map(a => a._id.toString());

    const userBidsOnGenuine = await Bid.find({
      userId: { $in: targetUserIds },
      auctionId: { $in: genuineAuctionIds }
    }).lean();

    if (userBidsOnGenuine.length > 0) {
      throw new Error(`Safety Violation: Test users have ${userBidsOnGenuine.length} bids on genuine demo auctions! Aborting.`);
    }
    console.log('✅ Safety Check Passed: Test users have zero bids on genuine auctions.');

    // 1.6 Export JSON Backup
    const backupPayload = {
      timestamp: new Date().toISOString(),
      auctions: targetAuctions,
      items: targetItems,
      bids: targetBids,
      users: targetUsers
    };

    const backupPath = path.join(__dirname, 'backup-deleted-records.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2));
    console.log(`\n📁 Backup of all ${targetAuctions.length} auctions, ${targetItems.length} items, ${targetBids.length} bids, and ${targetUsers.length} users exported to:`);
    console.log(`   ${backupPath}`);

    // -------------------------------------------------------------
    // STEP 2: EXECUTE TARGETED DELETION
    // -------------------------------------------------------------
    console.log('\n================ STEP 2: EXECUTING TARGETED DELETION ================');

    const deletedBids = await Bid.deleteMany({ auctionId: { $in: TARGET_AUCTION_IDS } });
    console.log(`✅ Deleted Bids: ${deletedBids.deletedCount}`);

    const deletedAuctions = await Auction.deleteMany({ _id: { $in: TARGET_AUCTION_IDS } });
    console.log(`✅ Deleted Auctions: ${deletedAuctions.deletedCount}`);

    const deletedItems = await Item.deleteMany({ _id: { $in: targetItemIds } });
    console.log(`✅ Deleted Items: ${deletedItems.deletedCount}`);

    const deletedUsers = await User.deleteMany({ email: { $in: TARGET_USER_EMAILS } });
    console.log(`✅ Deleted Users: ${deletedUsers.deletedCount}`);

    // -------------------------------------------------------------
    // STEP 3: POST-DELETION VERIFICATION
    // -------------------------------------------------------------
    console.log('\n================ STEP 3: POST-DELETION VERIFICATION ================');

    const remainingAuctions = await Auction.find().lean();
    console.log(`Remaining Total Auctions in Database: ${remainingAuctions.length}`);
    remainingAuctions.forEach((auc, index) => {
      console.log(`  ${index + 1}. ID: ${auc._id} | Title: "${auc.title}" | Status: ${auc.status}`);
    });

    const remainingUsers = await User.find().lean();
    console.log(`\nRemaining Total Users in Database: ${remainingUsers.length}`);

    const remainingBids = await Bid.find().lean();
    console.log(`Remaining Total Bids in Database: ${remainingBids.length}`);

    if (remainingAuctions.length === 5 && remainingBids.length === 60) {
      console.log('\n================ SUCCESS ================');
      console.log('🎉 TARGETED CLEANUP COMPLETED SAFELY AND VERIFIED!');
      console.log('   All 5 genuine demo auctions and 60 genuine bids remain 100% intact.');
      console.log('===========================================\n');
    } else {
      console.warn(`\nNotice: Remaining auctions count = ${remainingAuctions.length}, bids count = ${remainingBids.length}`);
    }

    await mongoose.disconnect();

  } catch (err) {
    console.error('❌ Safe Cleanup Error:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

executeSafeCleanup();
