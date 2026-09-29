const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const User = require('./models/User');
const Item = require('./models/Item');
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bidlive';

const seedDatabase = async () => {
  let mongoServer = null;
  try {
    console.log('🌱 Connecting to MongoDB for seeding...');
    
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('Connected to local MongoDB database!');
    } catch (err) {
      console.log('⚠️ Local MongoDB service not detected on port 27017.');
      console.log('🚀 Launching standalone in-memory MongoDB server for testing...');
      mongoServer = await MongoMemoryServer.create({ instance: { port: 27017 } });
      await mongoose.connect(mongoServer.getUri());
      console.log('Connected to in-memory MongoDB server!');
    }

    console.log('Clearing old data and syncing indexes...');
    await Bid.syncIndexes();
    await User.deleteMany({});
    await Item.deleteMany({});
    await Auction.deleteMany({});
    await Bid.deleteMany({});

    console.log('Creating Admin & 10 Users...');
    const hashedPassword = await bcrypt.hash('user123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@bidlive.com',
      password: adminPassword,
      role: 'admin',
    });

    const users = [];
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        name: `Bidder User ${i}`,
        email: `user${i}@bidlive.com`,
        password: hashedPassword,
        role: 'user',
      });
      users.push(user);
    }

    console.log('Creating Auction Items & Auctions...');
    const sampleItems = [
      {
        title: 'iPhone 15 Pro Max - 256GB',
        description: 'Brand new unopened iPhone 15 Pro Max in Natural Titanium.',
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
        startingPrice: 40000,
        increment: 1000,
        durationHours: 24,
      },
      {
        title: 'MacBook Pro 14" M3',
        description: 'Apple MacBook Pro M3 Chip, 16GB RAM, 512GB SSD Space Black.',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
        startingPrice: 100000,
        increment: 2000,
        durationHours: 48,
      },
      {
        title: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise cancelling wireless headphones.',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        startingPrice: 15000,
        increment: 500,
        durationHours: 12,
      },
      {
        title: 'PlayStation 5 Digital Edition',
        description: 'PS5 Digital Edition Console with extra DualSense Wireless Controller.',
        image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
        startingPrice: 30000,
        increment: 1000,
        durationHours: 36,
      },
      {
        title: 'Apple Watch Ultra 2',
        description: 'Titanium case with Ocean Band. GPS + Cellular 49mm.',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        startingPrice: 50000,
        increment: 1000,
        durationHours: 72,
      },
    ];

    const createdAuctions = [];
    const now = Date.now();

    for (const itemData of sampleItems) {
      const item = await Item.create({
        name: itemData.title,
        description: itemData.description,
        image: itemData.image,
      });

      const startTime = new Date(now - 2 * 60 * 60 * 1000); // started 2 hours ago
      const endTime = new Date(now + itemData.durationHours * 60 * 60 * 1000); // ends in future

      const auction = await Auction.create({
        itemId: item._id,
        title: itemData.title,
        description: itemData.description,
        imageUrl: itemData.image,
        startingPrice: itemData.startingPrice,
        minimumIncrement: itemData.increment,
        currentBid: itemData.startingPrice,
        startTime,
        endTime,
        status: 'ACTIVE',
      });

      createdAuctions.push(auction);
    }

    console.log('Generating 50+ bids across auctions...');
    let bidCount = 0;

    for (const auction of createdAuctions) {
      let currentPrice = auction.startingPrice;
      const bidsPerAuction = 12;

      for (let j = 0; j < bidsPerAuction; j++) {
        const randomUser = users[j % users.length];
        currentPrice += auction.minimumIncrement;

        await Bid.create({
          auctionId: auction._id,
          userId: randomUser._id,
          amount: currentPrice,
          createdAt: new Date(now - (bidsPerAuction - j) * 5 * 60 * 1000),
        });

        auction.currentBid = currentPrice;
        auction.currentWinner = randomUser._id;
        bidCount++;
      }

      await auction.save();
    }

    console.log(`\n================ SEED SUCCESS ================`);
    console.log(`✅ Database Seeding Complete!`);
    console.log(`- 1 Admin: admin@bidlive.com / admin123`);
    console.log(`- 10 Users: user1@bidlive.com ... user10@bidlive.com / user123`);
    console.log(`- ${createdAuctions.length} Active Auctions`);
    console.log(`- ${bidCount} Bids generated`);
    console.log(`==============================================\n`);

    if (!mongoServer) {
      await mongoose.disconnect();
      process.exit(0);
    } else {
      console.log('In-memory MongoDB remaining active for server tests...');
    }
  } catch (error) {
    console.error('❌ Error Seeding Database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
