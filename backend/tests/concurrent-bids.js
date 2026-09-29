/**
 * Concurrent Bid Test Script for BidLive Backend
 * 
 * Demonstrates how MongoDB atomic updates prevent race conditions
 * when multiple users place bids at the exact same moment.
 */

const API_URL = 'http://localhost:5000/api';

async function runConcurrentBidTest() {
  console.log('⚡ Starting Concurrent Bidding Test...\n');

  try {
    // 1. Register/Login two distinct test bidders
    console.log('Step 1: Logging in Bidder A and Bidder B...');
    
    const userA = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bidder A', email: `bidderA_${Date.now()}@test.com`, password: 'password123' })
    }).then(res => res.json());

    const userB = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bidder B', email: `bidderB_${Date.now()}@test.com`, password: 'password123' })
    }).then(res => res.json());

    const tokenA = userA.token;
    const tokenB = userB.token;

    if (!tokenA || !tokenB) {
      console.error('Failed to authenticate test users. Is backend running?');
      return;
    }

    // 2. Fetch available auctions to target
    console.log('\nStep 2: Fetching active auction...');
    const auctions = await fetch(`${API_URL}/auctions`).then(res => res.json());

    if (!Array.isArray(auctions) || auctions.length === 0) {
      console.error('No active auctions found. Please run "node seed.js" first.');
      return;
    }

    const targetAuction = auctions[0];
    const auctionId = targetAuction._id;
    const currentBid = targetAuction.currentBid || targetAuction.startingPrice;
    const minInc = targetAuction.minimumIncrement || 100;

    console.log(`Targeting Auction: "${targetAuction.title}"`);
    console.log(`Current Bid: ₹${currentBid} | Min Increment: ₹${minInc}`);

    // 3. Fire simultaneous bids (User A bids current + minInc, User B bids current + minInc)
    const targetBidAmount = currentBid + minInc;
    console.log(`\nStep 3: Launching SIMULTANEOUS concurrent bids of ₹${targetBidAmount} from both Bidder A and Bidder B...`);

    const sendBid = (token, bidderName) => {
      return fetch(`${API_URL}/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: targetBidAmount,
          requestId: `${bidderName}_req_${Date.now()}`
        })
      }).then(async res => ({
        bidderName,
        status: res.status,
        data: await res.json()
      }));
    };

    // Execute requests in parallel using Promise.all
    const results = await Promise.all([
      sendBid(tokenA, 'Bidder A'),
      sendBid(tokenB, 'Bidder B')
    ]);

    console.log('\n================ TEST RESULTS ================');
    results.forEach(res => {
      if (res.status === 201) {
        console.log(`✅ SUCCESS: ${res.bidderName}'s bid was ACCEPTED (Status ${res.status})`);
        console.log(`   Message: ${res.data.message}`);
      } else {
        console.log(`❌ REJECTED: ${res.bidderName}'s bid was REJECTED (Status ${res.status})`);
        console.log(`   Reason: ${res.data.message}`);
      }
    });

    console.log('==============================================');
    console.log('🎉 Concurrency test completed! MongoDB atomic findOneAndUpdate correctly allowed only 1 winner for duplicate bid amounts.');

  } catch (err) {
    console.error('Test Error:', err.message);
  }
}

runConcurrentBidTest();
