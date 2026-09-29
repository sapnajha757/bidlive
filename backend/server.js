const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const { MongoMemoryServer } = require('mongodb-memory-server');

// 1. Load Environment Variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bidlive';

// 2. Create Express App
const app = express();

// 3. Enable Middleware
app.use(cors());
app.use(express.json());

// 4. Create HTTP Server & Socket.IO Instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

// 7. Connect to MongoDB and Start Server
const startServer = async () => {
  try {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Connected to MongoDB database successfully.');
    } catch (dbErr) {
      console.log('⚠️ Local MongoDB service not found. Starting in-memory MongoDB server...');
      const mongoServer = await MongoMemoryServer.create({
        instance: { port: 27017, dbName: 'bidlive' },
      });
      await mongoose.connect('mongodb://127.0.0.1:27017/bidlive');
      console.log('✅ Connected to in-memory MongoDB instance successfully (bidlive database).');
    }

    server.listen(PORT, () => {
      console.log(`🚀 BidLive Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup error:', err.message);
  }
};

startServer();
