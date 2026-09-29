# ⚡ BidLive — Real-Time Multi-Auction System

BidLive is a real-time multi-auction MERN stack application where users can browse live auctions, place bids in real time, view bid history, and track won auctions. Admins can create and manage auction items.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router, Socket.IO Client
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT, bcrypt, dotenv, cors

---

## 🚀 Getting Started & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017 or automatically starts in-memory fallback for testing)

### 2. Backend Setup
```bash
cd backend
npm install
node seed.js    # Populates test users, admin, active auctions, and bids
node server.js  # Starts backend API on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev     # Starts Vite frontend on http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bidlive
JWT_SECRET=bidlive_super_secret_jwt_key_2026
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## 📡 API Routes

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login & receive JWT token |
| `GET` | `/api/auctions` | Public | List all active/upcoming/ended auctions |
| `GET` | `/api/auctions/:id` | Public | Get details of a single auction |
| `POST` | `/api/auctions` | Admin | Create a new auction item |
| `PUT` | `/api/auctions/:id` | Admin | Update existing auction |
| `POST` | `/api/auctions/:id/bids` | Authenticated | Place a bid on an active auction |
| `GET` | `/api/auctions/:id/bids` | Public | Get bid history for an auction |
| `GET` | `/api/users/me/bids` | Authenticated | Get bids placed by logged-in user |
| `GET` | `/api/users/me/wins` | Authenticated | Get auctions won by logged-in user |

---

## 🔒 Concurrency & Real-Time Bidding

- **Atomic DB Concurrency**: Uses MongoDB `findOneAndUpdate()` with `$expr` conditions (`numericAmount >= currentBid + minimumIncrement`). Simultaneous identical bids result in exactly 1 successful bid and 1 rejected bid.
- **Duplicate Request Protection**: `requestId` is checked in the database and backed by a MongoDB `{ unique: true, sparse: true }` index constraint.
- **Real-Time Updates**: Socket.IO room (`auction:<auctionId>`) broadcasts `newBid` and `auctionEnded` events to connected browsers without needing manual page refreshes.

---

## 🧪 Demo Credentials

- **Admin Account**: `admin@bidlive.com` / `admin123`
- **User Accounts**: `user1@bidlive.com` to `user10@bidlive.com` / `user123`
