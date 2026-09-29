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
- MongoDB (running locally on port 27017, or automatically uses the in-memory MongoDB fallback for testing)

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
node seed.js    # Populates test users, admin, active auctions, and bids
node server.js  # Starts backend API on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # Starts Vite frontend on http://localhost:5173
```

---


### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bidlive
JWT_SECRET=your_jwt_secret_key_here
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## 💾 Database & Persistence Behavior

- **Standalone MongoDB (Production / Local)**: When a local MongoDB service is running on `mongodb://127.0.0.1:27017/bidlive`, data persists permanently across process restarts.
- **In-Memory Fallback (Testing / Isolated Environment)**: If no local MongoDB service is detected on port 27017, the backend automatically initializes `mongodb-memory-server` in RAM. Note that in this fallback mode, data is held in-memory and will reset when the server process terminates.

---

## 📡 API Routes & Authorization

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login & receive Bearer JWT token |
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

- **Atomic DB Concurrency**: Uses MongoDB `findOneAndUpdate()` with `$expr` conditions (`numericAmount >= currentBid + minimumIncrement`). Simultaneous identical bids result in exactly 1 successful bid and 1 rejected bid without race conditions.
- **Duplicate Request Protection**: `requestId` is checked in the database and backed by a MongoDB `{ unique: true, sparse: true }` index constraint.
- **Real-Time Updates**: Socket.IO room (`auction:<auctionId>`) broadcasts `newBid` and `auctionEnded` events to connected browsers without needing manual page refreshes.

---



## 🧪 Testing Commands

- **Run Concurrency Bidding Test**:
  ```bash
  cd backend
  node tests/concurrent-bids.js
  ```

- **Run Comprehensive Edge Cases Test Suite**:
  ```bash
  cd backend
  node tests/edge-cases-test.js
  ```

- **Run Frontend Build Check**:
  ```bash
  cd frontend
  npm run build
  ```

---

## Edge Cases and Error Handling

| Edge Case | How BidLive Handles It | Validation or Test Performed | Current Status |
| :--- | :--- | :--- | :--- |
| **1. Multiple users bidding on same auction** | Handles sequential bids with real-time Socket.IO broadcasts and state updates. | Verified via `edge-cases-test.js` Case 1. | **PASS** |
| **2. Multiple bids arriving simultaneously** | Uses atomic `findOneAndUpdate()` with `$expr` price conditions. 1 succeeds (HTTP 201), duplicate is rejected (HTTP 400). | Verified via `concurrent-bids.js` & `edge-cases-test.js` Case 2. | **PASS** |
| **3. Bid lower than current highest bid** | Controller validates `numericAmount >= minRequiredBid` and returns HTTP 400 Bad Request. | Verified via `edge-cases-test.js` Case 3. | **PASS** |
| **4. Attempting to bid after auction ended** | Checks `endTime <= now` in controller and `endTime: { $gt: now }` in DB query. Returns HTTP 400. | Verified via `edge-cases-test.js` Case 4. | **PASS** |
| **5. Duplicate bid request (Same requestId)** | Scopes `requestId` check to user & auction with sparse unique index. Returns HTTP 200 with cached payload. | Verified via `edge-cases-test.js` Case 5. | **PASS** |
| **6. Multiple browser tabs open on same auction** | `AuctionDetails.jsx` socket listener deduplicates incoming `newBid` events using unique bid `_id`/`id`. | Verified via `edge-cases-test.js` Case 6. | **PASS** |
| **7. Current bid changes while placing bid** | Atomic DB update condition fails for stale bid amount and returns HTTP 400 with updated price error. | Verified via `edge-cases-test.js` Case 7. | **PASS** |
| **8. Multiple auctions ending simultaneously** | Socket.IO timer checks expired auctions independently and broadcasts isolated `auctionEnded` events per room. | Verified via `edge-cases-test.js` Case 8. | **PASS** |
| **9. Invalid auction ID** | Validates ObjectId format before querying. Returns clean HTTP 400 Bad Request (`Invalid auction ID format.`). | Verified via `edge-cases-test.js` Case 9. | **PASS** |
| **10. Server or API failure during bidding** | `bidController.js` implements atomic conditional rollback (`findOneAndUpdate`) if `Bid` document creation fails. | Verified via `edge-cases-test.js` Case 10. | **PASS** |
| **11. No active auctions available** | `GET /api/auctions` returns empty array `[]`. `Auctions.jsx` displays friendly empty state UI. | Verified via `edge-cases-test.js` Case 11. | **PASS** |

