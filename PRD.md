# Product Requirement Document (PRD) — BidLive

## 1. Executive Summary & Problem Statement

### 1.1 Problem Statement
Traditional online auction systems often suffer from latency issues, bid race conditions, inconsistent state representation between buyers, and inadequate handling of concurrent high-volume bidding traffic. In standard request-response web architectures, users must constantly refresh their browser to see updated prices, leading to accidental outbids, degraded user trust, and server bottlenecking.

### 1.2 Solution Overview
**BidLive** is a modern, real-time multi-auction web application built on the MERN stack (MongoDB, Express, React, Node.js) paired with Socket.IO. BidLive delivers sub-second real-time price synchronization across connected clients while enforcing strict atomic transaction integrity at the database layer to completely eliminate bid race conditions.

---

## 2. Target Users & User Stories

### 2.1 Target Persona
* **Bidders (General Users):** Individual buyers participating in live auctions, placing bids, monitoring active auctions in real time, and tracking their bidding history and won items.
* **Administrators (Platform Managers):** Superusers responsible for managing auction listings, setting starting prices, defining bid increments, scheduling auction start/end times, and managing item media.

### 2.2 Core User Stories
* **As a Bidder:**
  * I want to sign up and securely log in so that I can participate in active auctions.
  * I want to view active, upcoming, and ended auctions with live countdown timers.
  * I want to place bids in real time and immediately see price updates without reloading the page.
  * I want to be notified in real time when another user places a higher bid.
  * I want to view my active bids and past winning auctions on my profile dashboard.
* **As an Administrator:**
  * I want to create new auction items specifying initial prices, minimum bid increments, start/end dates, and item descriptions.
  * I want administrative privilege protection ensuring regular users cannot alter or create auction listings.

---

## 3. Auction Lifecycle & Bidding Rules

### 3.1 Auction Lifecycle States
1. **UPCOMING (`UPCOMING`):**
   * Auction has been scheduled but current system timestamp is before `startTime`.
   * Bids are strictly rejected by both backend validation and frontend UI controls.
   * A countdown timer counts down to `startTime`.
2. **ACTIVE (`ACTIVE`):**
   * Current system timestamp is between `startTime` and `endTime`.
   * Bids are actively accepted provided they meet all validity criteria.
   * Real-time Socket.IO events broadcast new valid bids to all connected room members.
3. **ENDED (`ENDED`):**
   * System timestamp has surpassed `endTime`.
   * Bidding is closed; any subsequent bid submissions are rejected.
   * The user with the highest `currentBid` is crowned `currentWinner`.

```
 [ Scheduled ] ──> (startTime reached) ──> [ ACTIVE ] ──> (endTime reached) ──> [ ENDED ]
                                                │                                  │
                                          Accepts Bids                       Declares Winner
```

### 3.2 Bidding Rules & Validation Constraints
* **Minimum Starting Price:** The first bid must be greater than or equal to `startingPrice`.
* **Minimum Bid Increment:** Subsequent bids must be greater than or equal to `currentBid + minimumIncrement`.
* **Self-Outbidding Prevention:** Bidders are prevented from placing a bid if they are already the leading high bidder (`currentWinner`).
* **Timestamp Scoping:** Bids are rejected if received before `startTime` or after `endTime`.

---

## 4. System Architecture & Technical Specifications

### 4.1 Tech Stack
* **Frontend:** React 19, Vite 8, Tailwind CSS 4, Lucide React, Socket.IO Client 4
* **Backend:** Node.js (v18+), Express 5, Socket.IO 4, Mongoose 9, MongoDB
* **Authentication:** JSON Web Tokens (JWT), bcrypt password hashing

### 4.2 API Routes Architecture

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Register a new user account |
| `/api/auth/login` | POST | Public | Authenticate user & return JWT token |
| `/api/auctions` | GET | Public | Fetch all active, upcoming, and ended auctions |
| `/api/auctions` | POST | Admin | Create a new auction listing |
| `/api/auctions/:id` | GET | Public | Fetch detailed information for a single auction |
| `/api/auctions/:id` | PUT | Admin | Update an existing auction details |
| `/api/auctions/:auctionId/bids` | POST | Authenticated | Place a new bid on a specific auction |
| `/api/auctions/:auctionId/bids` | GET | Public | Fetch full bid history for an auction |
| `/api/users/me/bids` | GET | Authenticated | Fetch active bids placed by current user |
| `/api/users/me/wins` | GET | Authenticated | Fetch auctions won by current user |

---

## 5. Concurrency, Real-Time Sync & Data Integrity

### 5.1 Atomic Concurrency Control & State Compensation
To prevent race conditions where two simultaneous requests attempt to place a bid on the same auction at the exact same time:
* BidLive utilizes MongoDB's atomic `findOneAndUpdate` with a query-level expression condition (`$expr` / price comparison).
* The auction update condition ensures that the target `currentBid` has not changed between reading the auction state and committing the update.
* If a concurrent request fails the condition check, the update returns `null` and the transaction aborts cleanly with an HTTP `400 Bad Request`, preserving data consistency without locking issues.
* **State Compensation (Rollback Handling):** If `Bid.create()` fails after `findOneAndUpdate` succeeded, the controller catches the exception and executes an automated compensation query (`findByIdAndUpdate`) reverting `currentBid` and `currentWinner` to their pre-update state.

### 5.2 Idempotency & Request Deduplication
* Client requests pass a unique `requestId` (UUID / Client-generated hash).
* A sparse unique index on `requestId` in the `Bid` collection guarantees that network retries or double-clicks do not create duplicate bid records in MongoDB. Duplicate requests return HTTP 200 with the already processed bid payload.

### 5.3 Socket.IO Real-Time Synchronization
* Clients join individual auction rooms (`auction:<auctionId>`) upon navigating to `AuctionDetails`.
* Successful backend bid transactions trigger an immediate `newBid` Socket.IO event broadcast to room participants.
* Frontend components implement deduplication checks based on unique document IDs (`_id`) to ensure local optimistic state updates and socket broadcasts seamlessly co-exist without duplication.

---

## 6. Non-Functional Requirements

### 6.1 Performance
* **Sub-second Latency:** Real-time updates delivered over WebSockets within 100ms across active room connections.
* **Concurrent Capacity:** Handles simultaneous incoming bids with atomic DB updates without deadlocks or dirty reads.

### 6.2 Security
* **Authentication:** JWT tokens stored securely and validated on protected endpoints via Express middleware.
* **Password Hashing:** Passwords hashed with bcrypt (salt factor 10) prior to DB storage.
* **Input Sanitization:** Express routes validate types, numerical ranges, and ObjectIDs.
* **Credential Isolation:** Environment secrets isolated in untracked `.env` files.

---

## 7. Known Limitations & Future Enhancements

### 7.1 Current Known Limitations
* Database transactions rely on single-document atomic update semantics with compensation fallback when MongoDB is running as a standalone node without a replica set setup.
* Socket connection relies on a single Node server instance (horizontal scaling across multiple nodes would require Redis Pub/Sub adapter).

### 7.2 Future Enhancements
1. **Redis Adapter Integration:** Enable multi-instance Socket.IO clustering via Redis adapter.
2. **Automated End-of-Auction Notifications:** Web push notifications or email alerts when an outbid occurs or an auction ends.
3. **Auto-Bidding (Proxy Bidding):** Allow users to set a maximum bid ceiling for automatic incremental outbidding.
4. **Stripe Payment Gateway:** Integrated checkout workflow for auction winners.
