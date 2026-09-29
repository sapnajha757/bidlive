const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// 1. Load Environment Variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bidlive';

// 2. Create Express App
const app = express();

const clientOrigin = process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173'] : '*';

// 3. Enable Middleware
app.use(cors({
  origin: clientOrigin,
  credentials: true,
}));
app.use(express.json());

// 4. Create HTTP Server & Socket.IO Instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Store io instance in app so controllers can emit real-time events
app.set('io', io);

// 5. Initialize Socket.IO logic
const initSocket = require('./socket/socket');
initSocket(io);

// 6. Routes Setup
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const bidRoutes = require('./routes/bidRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/users', bidRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'BidLive Backend API Server is running 🚀' });
});

// Helper to safely mask credentials in database connection URI logs
const maskUri = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/(.*?)@/, '//***:***@');
};

// 7. Connect to MongoDB and Start Server
const startServer = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isExternalUri = process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1') && !process.env.MONGO_URI.includes('localhost');

  try {
    console.log(`🔌 Connecting to MongoDB database at ${maskUri(MONGO_URI)}...`);

    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to MongoDB database successfully.');
    } catch (dbErr) {
      console.error(`❌ MongoDB connection failed (${maskUri(MONGO_URI)}): ${dbErr.message}`);

      // In production or when explicitly configured with an Atlas/external URI, fail cleanly instead of falling back to in-memory DB
      if (isProduction || isExternalUri) {
        console.error('❌ Refusing in-memory fallback for production/Atlas environment. Aborting startup.');
        process.exit(1);
      }

      console.log('⚠️ Local MongoDB service not found. Starting in-memory MongoDB server for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        instance: { port: 27017, dbName: 'bidlive' },
      });
      await mongoose.connect('mongodb://127.0.0.1:27017/bidlive');
      const Bid = require('./models/Bid');
      await Bid.syncIndexes();
      console.log('✅ Connected to in-memory MongoDB instance successfully (bidlive database).');
    }

    const Bid = require('./models/Bid');
    await Bid.syncIndexes();

    server.listen(PORT, () => {
      console.log(`🚀 BidLive Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup error:', err.message);
    process.exit(1);
  }
};

startServer();
