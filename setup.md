# Setup & Developer Guide — BidLive

This document provides a comprehensive step-by-step guide to installing, configuring, running, and testing the **BidLive** real-time multi-auction system locally.

---

## 1. Prerequisites

Before getting started, ensure your environment meets the following requirements:

* **Node.js**: v18.0.0 or higher (v18+ required by Express 5, Mongoose 9, and Vite 8)
* **npm**: v8.x or higher (comes with Node.js)
* **MongoDB**: Local MongoDB Server (v5.0+) OR MongoDB Atlas connection URI.
  *(Note: If local MongoDB service is not running on port 27017, the backend automatically falls back to `mongodb-memory-server` in RAM for seamless testing).*
* **Git**: Installed for version control operations.

---

## 2. Directory Structure Overview

```
bidlive/
├── backend/                # Express & Socket.IO server
│   ├── controllers/        # Request handlers (auctions, bids, auth)
│   ├── middleware/         # Auth JWT and Admin middleware
│   ├── models/             # Mongoose schemas (User, Auction, Bid, Item)
│   ├── routes/             # Express API routes
│   ├── socket/             # Socket.IO room and timer handlers
│   ├── tests/              # Concurrency testing scripts (concurrent-bids.js)
│   ├── seed.js             # Database seeding script
│   ├── server.js           # Main application entry point
│   └── .env.example        # Backend environment variable template
├── frontend/               # React 19 + Vite + Tailwind CSS client
│   ├── src/                # React source files (components, pages, services)
│   ├── package.json        # Frontend dependencies & scripts
│   └── .env.example        # Frontend environment variable template
├── PRD.md                  # Product Requirements Document
├── setup.md                # Setup & developer guide
└── README.md               # Project overview
```

---

## 3. Installation Steps

### Step 1: Open Project Directory
Navigate to the project root directory:
```bash
cd "c:/Users/sapna jha/bidlive"
```

### Step 2: Install Backend Dependencies
Navigate to the `backend/` directory and install dependencies:
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
Navigate to the `frontend/` directory and install dependencies:
```bash
cd ../frontend
npm install
```

---

## 4. Environment Configuration

### Backend Environment Configuration
Create a `.env` file inside the `backend/` directory using `backend/.env.example` as a template:

```bash
# Path: backend/.env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bidlive
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

> [!IMPORTANT]
> Never commit `.env` files containing real secrets to version control. Keep secrets strictly in local `.env` files.

### Frontend Environment Configuration
Create a `.env` file inside the `frontend/` directory using `frontend/.env.example` as a template:

```bash
# Path: frontend/.env
VITE_API_URL=http://localhost:5000
```

---

## 5. Database Setup & Seeding

BidLive includes a database seed script to populate demo users, sample auction items, active auctions, and bid histories.

Run the seed script from the `backend/` directory:
```bash
cd backend
node seed.js
```

### Demo Accounts Created by `seed.js`:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@bidlive.com` | `admin123` | Full access (Create/Update Auctions, Bid) |
| **User Accounts** (10) | `user1@bidlive.com` ... `user10@bidlive.com` | `user123` | Regular Users (Place Bids, Track Wins, View History) |

---

## 6. Running the Application

To run the complete system, start both the backend server and the frontend development server.

### Terminal 1: Start Backend Server
```bash
cd backend
node server.js
```
* The backend server will start on `http://localhost:5000`.
* Real-time Socket.IO listener will initialize on port 5000.

### Terminal 2: Start Frontend Development Server
```bash
cd frontend
npm run dev
```
* The Vite dev server will start on `http://localhost:5173`.
* Open `http://localhost:5173` in your browser to access BidLive.

---

## 7. Testing & Verification Commands

### 7.1 Run Atomic Concurrency Tests
To verify that the bidding engine handles simultaneous concurrent bids cleanly without race conditions:

1. Ensure the backend server is running (`node server.js`).
2. Run the concurrent bidding test script from the `backend/` directory:
```bash
cd backend
node tests/concurrent-bids.js
```
* **Expected Result:** Exactly one bid succeeds (HTTP 201), and the conflicting simultaneous bid is safely rejected (HTTP 400).

### 7.2 Test Production Frontend Build
Verify that the frontend builds without JSX/build errors by running Vite build inside the `frontend/` directory:
```bash
cd frontend
npm run build
```

---

## 8. API Endpoints Quick Reference

| Endpoint | Method | Auth Level | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Register new user account |
| `/api/auth/login` | `POST` | Public | Login user, returns Bearer JWT token |
| `/api/auctions` | `GET` | Public | Fetch list of all auctions |
| `/api/auctions/:id` | `GET` | Public | Fetch single auction details |
| `/api/auctions` | `POST` | Admin | Create new auction (Header: `Authorization: Bearer <token>`) |
| `/api/auctions/:id` | `PUT` | Admin | Update existing auction (Header: `Authorization: Bearer <token>`) |
| `/api/auctions/:auctionId/bids` | `POST` | Authenticated | Place bid on auction (`{ amount, requestId }`) |
| `/api/auctions/:auctionId/bids` | `GET` | Public | Get bid history for an auction |
| `/api/users/me/bids` | `GET` | Authenticated | Get bids placed by logged-in user |
| `/api/users/me/wins` | `GET` | Authenticated | Get auctions won by logged-in user |

---

## 9. Troubleshooting Common Issues

### Issue 1: MongoDB Connection Error (`ECONNREFUSED 127.0.0.1:27017`)
* **Cause:** Local MongoDB service is not running on port 27017.
* **Solution:** Start your local MongoDB server (`mongod`), or let the backend automatically launch the built-in `mongodb-memory-server` in RAM.

### Issue 2: Port 5000 or 5173 Already in Use
* **Cause:** A previous instance of Node or Vite is running in the background.
* **Solution:**
  * Windows PowerShell: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`
  * Or change `PORT` in `backend/.env`.

### Issue 3: Socket.IO Connection Failing (CORS / Connection Refused)
* **Cause:** `CLIENT_URL` in `backend/.env` does not match the frontend Vite URL (`http://localhost:5173`) or `VITE_API_URL` is missing in `frontend/.env`.
* **Solution:** Ensure `VITE_API_URL=http://localhost:5000` in `frontend/.env` and `CLIENT_URL=http://localhost:5173` in `backend/.env`.

### Issue 4: JWT Unauthorized (401 / 403 Errors)
* **Cause:** Missing or expired Authorization header in API calls.
* **Solution:** Re-login through the UI or ensure the header is formatted as `Authorization: Bearer <JWT_TOKEN>`.
