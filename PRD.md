# Product Requirements Document (PRD) — BidLive

## 1. Executive Summary and Problem Statement

### 1.1 Problem Statement

In an online auction, multiple users may try to place bids on the same item at almost the same time. This can create problems if the system does not handle simultaneous requests properly. Users may also see outdated prices if the application depends on manually refreshing the page to get the latest information.

These issues can lead to incorrect bid updates, confusion among users, and a poor bidding experience. As the number of users increases, handling these situations becomes even more important.

### 1.2 Solution Overview

BidLive is a real-time multi-auction web application built using the MERN stack and Socket.IO. It allows users to browse auctions, place bids, follow price changes in real time, and check their bidding history and won auctions.

The application also includes an admin panel for creating and managing auction listings.

While developing BidLive, I focused on keeping the bidding process reliable. The backend validates each bid, checks the latest auction state, and uses conditional MongoDB updates to reduce the risk of conflicting bids. Socket.IO is used to share accepted bid updates with connected users without requiring them to refresh the page.

The goal is to provide a smoother auction experience while keeping auction data consistent when multiple users are bidding at the same time.

---

## 2. Target Users and User Stories

### 2.1 Target Users

**Bidders (General Users)**

These are users who participate in auctions. They can browse available items, place bids, follow live price updates, and check their bidding history and won auctions.

**Administrators (Platform Managers)**

Admins manage the auction listings. They can create auctions, update item details, set starting prices and minimum bid increments, and configure auction timings.

### 2.2 Core User Stories

**As a bidder, I want to:**

- Register and log in securely so that I can participate in auctions.
- Browse active, upcoming, and ended auctions.
- View auction details, current prices, and countdown timers.
- Place bids and see accepted price updates without refreshing the page.
- Receive real-time updates when another user places a bid.
- View my bidding history and the auctions I have won.

**As an administrator, I want to:**

- Create auction listings with item descriptions, starting prices, minimum bid increments, and start and end times.
- Update existing auction details when required.
- Restrict auction management operations to authorized administrators so that regular users cannot create or modify listings.

---

## 3. Auction Lifecycle and Bidding Rules

### 3.1 Auction Lifecycle

Every auction moves through three main states: upcoming, active, and ended.

**1. Upcoming (`UPCOMING`)**

- The auction has been scheduled, but its start time has not arrived.
- Users can view the auction and its countdown timer.
- Bids must be rejected until the auction becomes active.

**2. Active (`ACTIVE`)**

- The current time falls within the auction's scheduled start and end times.
- Users can place bids if they meet the application's validation rules.
- Accepted bids are shared with connected users through Socket.IO.

**3. Ended (`ENDED`)**

- The auction's end time has passed.
- New bids are rejected.
- The user associated with the highest accepted bid is identified as the winner, provided the auction has received a valid bid.

### Auction Lifecycle Flow

```text
Scheduled Auction
       |
       v
   Upcoming
       |
       | Start time reached
       v
    Active
       |
       | End time reached
       v
     Ended
       |
       v
Winner determined from
the highest accepted bid
```

### 3.2 Bidding Rules and Validation

BidLive follows a set of rules to ensure that bids are checked before they are accepted.

- **Starting price:** The first bid must meet or exceed the configured starting price.
- **Minimum bid increment:** After the first bid, each new bid must be at least the current highest bid plus the minimum increment.
- **Self-outbidding prevention:** A user who is already the leading bidder cannot place another bid on the same auction.
- **Auction timing:** Bids submitted before the start time or after the end time are rejected.
- **Backend validation:** The server checks the bid amount and auction state instead of relying only on frontend validation.

---

## 4. System Architecture and Technical Specifications

### 4.1 Technology Stack

**Frontend**

- React 19
- Vite 8
- Tailwind CSS 4
- Lucide React
- Socket.IO Client 4

The frontend handles the user interface, auction pages, bidding interactions, and live updates.

**Backend**

- Node.js (v18+)
- Express 5
- Socket.IO 4
- Mongoose 9
- MongoDB

The backend handles API requests, authentication, auction rules, bid validation, and communication with the database.

**Authentication and Security**

- JSON Web Tokens (JWT)
- bcrypt password hashing

JWT is used to authenticate protected requests, while bcrypt is used to hash passwords before storing them.

### 4.2 API Routes

The following table describes the main API endpoints used by BidLive.

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Register a new account |
| `/api/auth/login` | POST | Public | Log in and receive a JWT |
| `/api/auctions` | GET | Public | Retrieve auction listings |
| `/api/auctions` | POST | Admin | Create an auction |
| `/api/auctions/:id` | GET | Public | Retrieve auction details |
| `/api/auctions/:id` | PUT | Admin | Update an existing auction |
| `/api/auctions/:auctionId/bids` | POST | Authenticated | Place a bid |
| `/api/auctions/:auctionId/bids` | GET | Public | Retrieve an auction's bid history |
| `/api/users/me/bids` | GET | Authenticated | View the logged-in user's bids |
| `/api/users/me/wins` | GET | Authenticated | View auctions won by the logged-in user |

---

## 5. Concurrency, Real-Time Updates, and Data Integrity

### 5.1 Handling Simultaneous Bids

One of the main technical challenges in BidLive is handling multiple users who try to place a bid on the same auction at nearly the same time.

For example, if the current bid is ₹5,000 and the minimum increment is ₹500, two users might submit a bid of ₹5,500 simultaneously. If both requests rely on the same outdated price, the system could accept conflicting updates.

To reduce this risk, BidLive uses MongoDB's conditional `findOneAndUpdate()` operation with query conditions that check the current auction state and bid requirements.

The process works as follows:

- The backend validates the incoming bid.
- MongoDB checks whether the auction still satisfies the update conditions.
- The first request that successfully meets those conditions updates the auction.
- A competing request that no longer satisfies the conditions is rejected.

This provides atomicity for the individual auction-document update.

**Recovery when bid creation fails:** The auction document may be updated before the corresponding bid record is saved. If `Bid.create()` fails, the controller attempts to restore the previous auction state using a compensating database update.

This is a recovery mechanism, not a full multi-document transaction. Using MongoDB transactions on a supported replica set would be a possible improvement for stronger consistency.

### 5.2 Preventing Duplicate Bid Requests

Sometimes a user may click the bid button more than once, or a network retry may send the same request again.

To handle this situation, BidLive uses a unique `requestId` to identify repeated bid requests. A sparse unique index on the `requestId` field in the Bid collection provides an additional safeguard against duplicate records.

When the backend recognizes a previously processed request, it can return the existing bid result instead of creating another record.

The request-handling logic should also ensure that request IDs are scoped appropriately so that one user's request cannot be mistaken for another user's request.

### 5.3 Real-Time Synchronization with Socket.IO

BidLive uses Socket.IO to keep users viewing the same auction updated.

The application follows this process:

1. A user opens an auction's detail page.
2. The client joins the corresponding auction room, named `auction:<auctionId>`.
3. The user submits a bid through the REST API.
4. The backend validates the bid and processes the database update.
5. After the bid is accepted and recorded, the server emits a `newBid` event to the relevant auction room.
6. Connected clients receive the event and update their displayed prices and bid history.

The frontend also checks unique bid document IDs (`_id`) to avoid displaying the same bid more than once when socket events and local state updates overlap.

---

## 6. Non-Functional Requirements

Non-functional requirements describe how the application should perform, rather than only listing the features it provides.

### 6.1 Performance and Reliability

**Real-time response:** The target is to deliver price updates in under one second during normal operating conditions. The stated 100 ms target can be used as a more specific performance goal that should be measured through testing.

**Concurrent bidding:** The database update conditions should prevent competing requests from accepting bids based on an outdated auction price.

**Consistent auction state:** The system should keep the current bid, highest bidder, and bid history as consistent as possible, including when a database operation fails.

### 6.2 Security

- **Authentication:** Protected API endpoints require a valid JWT.
- **Password protection:** Passwords are hashed using bcrypt with the configured salt factor of 10.
- **Input validation:** The backend should validate data types, bid amounts, and auction IDs before processing requests.
- **Role-based access:** Only authorized admins can create or update auction listings.
- **Credential protection:** Database credentials and authentication secrets are stored in environment variables rather than committed to the repository.

---

## 7. Known Limitations and Future Enhancements

### 7.1 Current Limitations

BidLive provides the core functionality required for a real-time multi-auction application, but there are areas that can be improved.

- **Multi-document consistency:** The current compensation approach does not provide the same guarantees as a full transaction covering both the auction update and bid-record creation.
- **Single-instance real-time communication:** Coordinating Socket.IO events across multiple backend instances would require a shared messaging solution, such as the Redis adapter.
- **Performance verification:** More load testing is needed to measure how the application behaves with a large number of simultaneous users and bid requests.
- **Auction recovery:** Auction-ending behavior should be tested during server restarts and temporary service interruptions.

### 7.2 Future Enhancements

**1. Redis Adapter Integration**

Add a Redis adapter to coordinate Socket.IO events across multiple backend instances and support horizontal scaling.

**2. Auction Notifications**

Introduce email or web push notifications to inform users when they are outbid or when an auction ends.

**3. Auto-Bidding (Proxy Bidding)**

Allow users to set a maximum bid amount. The system could then place incremental bids on their behalf according to the auction's rules.

**4. Payment Integration**

Integrate a payment gateway such as Stripe to support a checkout process for auction winners. Payment handling would require additional security and transaction-flow design.

---

## Conclusion

BidLive was designed to provide a more responsive auction experience while addressing the challenges that arise when multiple users interact with the same auction.

The project combines a React frontend, an Express backend, MongoDB, JWT authentication, and Socket.IO real-time communication. Particular attention has been given to bid validation, simultaneous requests, duplicate submissions, and synchronization between connected clients.

The current implementation provides a foundation for a real-time auction platform, with clear opportunities to improve transactional consistency, automated testing, performance monitoring, and support for larger workloads.