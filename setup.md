# BidLive — Setup and Developer Guide

This guide explains how to set up BidLive on your local machine, configure the database, run the application, and test its main features.

Follow the steps in order to get both the frontend and backend running.

---

## 1. Prerequisites

Before setting up BidLive, make sure you have the following installed:

- **Node.js:** Version 18 or newer.
- **npm:** Used to install project dependencies. It comes with Node.js.
- **MongoDB:** Either a local MongoDB installation or a MongoDB Atlas connection string.
- **Git:** Required to clone the repository and manage code changes.

You can check your Node.js and npm versions by running:

```bash
node -v
npm -v
```

If these commands return version numbers, you can move on to the installation steps.

---

## 2. Project Structure

BidLive is divided into two main parts: the frontend and the backend.

```text
bidlive/
├── backend/
│   ├── controllers/       # Handles application logic
│   ├── middleware/        # Authentication and admin checks
│   ├── models/            # MongoDB data models
│   ├── routes/            # API route definitions
│   ├── socket/            # Real-time events and timers
│   ├── tests/             # Test scripts
│   ├── seed.js            # Creates sample database data
│   ├── server.js          # Starts the backend server
│   └── .env.example       # Backend configuration template
│
├── frontend/
│   ├── src/               # React components, pages and services
│   ├── package.json       # Frontend dependencies and scripts
│   └── .env.example       # Frontend configuration template
│
├── PRD.md                 # Product requirements
├── setup.md               # Setup and developer guide
└── README.md              # Project overview and documentation
```

The backend manages API requests, authentication, bidding rules, and database operations. The frontend provides the interface users interact with.

---

## 3. Installation

### Step 1: Open the Project Folder

Open a terminal and navigate to the directory where you cloned BidLive.

For example, if the project is in your current directory:

```bash
cd bidlive
```

### Step 2: Install Backend Dependencies

Move into the backend folder and install its dependencies.

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

Return to the project root, open the frontend folder, and install its dependencies.

```bash
cd ../frontend
npm install
```

Once both installations are complete, configure the environment variables before starting the application.

---

## 4. Environment Configuration

The frontend and backend use separate `.env` files. These files contain configuration values needed to connect the application and its services.

### 4.1 Backend Configuration

Inside the `backend` folder, create a file named `.env`. Use `backend/.env.example` as your starting point.

Add the following configuration:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bidlive
JWT_SECRET=replace_with_a_private_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Here's what each variable does:

- `PORT`: The port on which the backend server runs.
- `MONGO_URI`: The connection string for your MongoDB database.
- `JWT_SECRET`: The secret used to sign and verify JWTs.
- `CLIENT_URL`: The frontend URL allowed to communicate with the backend.
- `NODE_ENV`: Identifies the current environment.

**Using MongoDB Atlas?** Replace the local MongoDB connection string with your Atlas connection URI.

Keep your actual database credentials and JWT secret private. Never commit a real `.env` file to GitHub.

### 4.2 Frontend Configuration

Inside the `frontend` folder, create another `.env` file using `frontend/.env.example` as a reference.

Add:

```env
VITE_API_URL=http://localhost:5000
```

This tells the frontend which backend URL to use for API requests.

For local development, the frontend and backend URLs should match the ports configured in your application.

---

## 5. Database Setup and Sample Data

BidLive includes a `seed.js` script for populating the database with sample users, auction items, auctions, and bid history.

To run it, open a terminal in the backend directory:

```bash
cd backend
node seed.js
```

Use this script when you want to prepare a fresh development database for testing.

**Important:** Check what the seed script changes before running it against an existing database. Avoid running scripts that clear or replace data against your production database.

### Demo Accounts

The seed configuration is intended to create the following demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bidlive.com` | `admin123` |
| User 1–10 | `user1@bidlive.com` to `user10@bidlive.com` | `user123` |

The admin account is intended for creating and updating auctions. Regular user accounts are intended for placing bids and viewing bidding history and wins.

These are development/demo credentials. Do not use them as production credentials.

---

## 6. Running BidLive Locally

You need two terminal windows: one for the backend and one for the frontend.

### Terminal 1: Start the Backend

Open a terminal in the project folder and run:

```bash
cd backend
node server.js
```

The backend should start on:

```text
http://localhost:5000
```

The Socket.IO server also runs with the backend and handles real-time auction communication.

### Terminal 2: Start the Frontend

Open a second terminal in the project folder and run:

```bash
cd frontend
npm run dev
```

Vite will display the local frontend URL, normally:

```text
http://localhost:5173
```

Open that URL in your browser to use BidLive.

You can now register or log in, browse auctions, place bids, and view live updates.

---

## 7. Testing and Verification

BidLive includes scripts for checking important bidding scenarios and verifying the frontend build.

### 7.1 Test Simultaneous Bids

This test checks how the backend responds when multiple bid requests compete for the same auction.

First, make sure the backend is running and the test database is configured.

Then run the test from the backend directory:

```bash
cd backend
node tests/concurrent-bids.js
```

**Expected behavior:** When two requests compete using the same outdated auction price, one valid update should succeed while the conflicting request should be rejected.

The expected HTTP responses in the current test description are `201 Created` for the successful bid and `400 Bad Request` for the rejected bid.

Run the test and check the actual terminal output to confirm the result.

### 7.2 Verify the Frontend Build

To check whether the frontend can be built for production, run:

```bash
cd frontend
npm run build
```

If the command completes successfully, Vite has generated the production build without a build-time error.

For the other available test scripts, check the `backend/tests` directory and the project's README.

**Testing tip:** Use an isolated development/test database rather than production data.

---

## 8. API Quick Reference

These are the main API endpoints used by BidLive.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new account |
| POST | `/api/auth/login` | Public | Log in and receive a JWT |
| GET | `/api/auctions` | Public | Retrieve auction listings |
| GET | `/api/auctions/:id` | Public | Retrieve auction details |
| POST | `/api/auctions` | Admin | Create an auction |
| PUT | `/api/auctions/:id` | Admin | Update an auction |
| POST | `/api/auctions/:auctionId/bids` | Authenticated | Place a bid |
| GET | `/api/auctions/:auctionId/bids` | Public | View an auction's bid history |
| GET | `/api/users/me/bids` | Authenticated | View your bids |
| GET | `/api/users/me/wins` | Authenticated | View auctions you have won |

Protected endpoints require the appropriate authentication token. Admin-only endpoints also require admin authorization.

For authenticated requests, the token is normally sent through the `Authorization` header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The bid endpoint accepts the bid amount and request ID according to the backend's expected request format.

---

## 9. Troubleshooting

Here are a few common issues you may encounter while setting up BidLive.

### Issue 1: MongoDB Connection Error

**Example:** `ECONNREFUSED 127.0.0.1:27017`

This usually means that the backend cannot connect to MongoDB at the configured local address.

**What to check:**

- Make sure your local MongoDB service is running.
- Check that `MONGO_URI` in `backend/.env` is correct.
- If you use MongoDB Atlas, verify the connection string, database credentials, and network access settings.

If your backend supports `mongodb-memory-server` fallback, check its configuration and terminal output to confirm whether that fallback is available and has started successfully.

### Issue 2: Port 5000 or 5173 Is Already in Use

This can happen when another backend or frontend development server is already running.

**What to do:**

- Stop the existing process if it is no longer needed.
- Alternatively, configure the backend to use another available port through `PORT` in `backend/.env`.
- If you change the backend port, update `VITE_API_URL` in `frontend/.env` to match.

On Windows PowerShell, you can identify the process using port 5000 with:

```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue |
    Select-Object -Property OwningProcess
```

Check the process ID before stopping anything.

### Issue 3: Socket.IO Connection Fails

This may happen if the frontend and backend URLs do not match the configured settings.

**Check the following:**

- `CLIENT_URL` in `backend/.env` should match the frontend origin.
- `VITE_API_URL` in `frontend/.env` should point to the running backend.
- Restart the relevant development servers after changing environment variables.

For local development, the expected values are:

```env
# backend/.env
CLIENT_URL=http://localhost:5173
```

```env
# frontend/.env
VITE_API_URL=http://localhost:5000
```

### Issue 4: JWT Unauthorized Errors (401 or 403)

These errors may occur when a request is missing a valid authentication token or the logged-in user does not have the required permissions.

**What to do:**

- Log in again through the application.
- Check whether the request includes the correct JWT.
- Confirm that the `Authorization` header uses the `Bearer` format.
- For admin-only operations, make sure the account has the admin role.

---

## Final Notes

Once the frontend and backend are running and the database is configured, you can explore the main BidLive features locally.

If you run into an issue, start by checking the terminal output, environment variables, and database connection. These checks can help identify most common setup problems.

For an overview of the features and technical decisions behind the application, see `README.md` and `PRD.md`.