/**
 * Test script for auditing Starting Bid edit functionality
 */
const API_URL = 'http://localhost:5000/api';

async function auditStartingBid() {
  console.log('🧪 Starting Audit & Verification of Starting Bid Functionality...\n');

  try {
    // 1. Login Admin
    console.log('Step 1: Authenticating Admin user...');
    const adminRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@bidlive.com', password: 'admin123' })
    }).then(res => res.json());

    const adminToken = adminRes.token;
    if (!adminToken) {
      console.error('❌ Failed to authenticate admin user. Ensure backend server is running.');
      return;
    }
    console.log('✅ Admin authenticated successfully.');

    // 2. Create a Dedicated Test Auction
    console.log('\nStep 2: Creating a dedicated test auction (Starting Price: ₹10,000)...');
    const createRes = await fetch(`${API_URL}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: `Test Audit Item ${Date.now()}`,
        description: 'Test item for auditing starting bid edits',
        startingPrice: 10000,
        minimumIncrement: 500,
        startTime: new Date(Date.now() - 60000).toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      })
    }).then(res => res.json());

    const testAuction = createRes.auction;
    if (!testAuction || !testAuction._id) {
      console.error('❌ Failed to create test auction:', createRes);
      return;
    }
    console.log(`✅ Created Test Auction ID: ${testAuction._id}`);
    console.log(`   Initial startingPrice: ₹${testAuction.startingPrice} | Initial currentBid: ₹${testAuction.currentBid}`);

    // 3. Edit Auction: Decrease Starting Price from ₹10,000 to ₹5,000
    console.log('\nStep 3: Decreasing Starting Price from ₹10,000 to ₹5,000 via Admin API...');
    const updateRes = await fetch(`${API_URL}/auctions/${testAuction._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        startingPrice: 5000,
        minimumIncrement: 500
      })
    }).then(res => res.json());

    const updatedAuction = updateRes.auction;
    console.log(`   Updated startingPrice: ₹${updatedAuction.startingPrice} | Updated currentBid: ₹${updatedAuction.currentBid}`);

    // 4. Verify Fetching Single Auction Detail Endpoint
    console.log('\nStep 4: Fetching single auction details (GET /api/auctions/:id)...');
    const fetchedAuction = await fetch(`${API_URL}/auctions/${testAuction._id}`).then(res => res.json());
    console.log(`   Fetched startingPrice: ₹${fetchedAuction.startingPrice} | Fetched currentBid: ₹${fetchedAuction.currentBid}`);

    // 5. Test Placing a Bid at the New Lower Starting Price (₹5,000)
    console.log('\nStep 5: Registering Test Bidder and placing a bid of ₹5,000...');
    const bidderRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Audit Bidder', email: `audit_bidder_${Date.now()}@test.com`, password: 'password123' })
    }).then(res => res.json());

    const bidderToken = bidderRes.token;

    const bidRes = await fetch(`${API_URL}/auctions/${testAuction._id}/bids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bidderToken}`
      },
      body: JSON.stringify({ amount: 5000 })
    }).then(async res => ({ status: res.status, data: await res.json() }));

    console.log(`   Bid Response (Status ${bidRes.status}):`, bidRes.data.message);

    // 6. Test Decreasing Starting Price ON AN AUCTION WITH EXISTING BIDS
    console.log('\nStep 6: Attempting to edit startingPrice to ₹2,000 on an auction that ALREADY has a ₹5,000 bid...');
    const editWithBidRes = await fetch(`${API_URL}/auctions/${testAuction._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        startingPrice: 2000
      })
    }).then(res => res.json());

    const auctionAfterEdit = editWithBidRes.auction;
    console.log(`   After Edit - startingPrice: ₹${auctionAfterEdit.startingPrice} | currentBid: ₹${auctionAfterEdit.currentBid}`);

    if (auctionAfterEdit.currentBid === 5000 && auctionAfterEdit.startingPrice === 2000) {
      console.log('✅ PASS: Highest bid of ₹5,000 was preserved and NOT overwritten when startingPrice was changed to ₹2,000.');
    } else {
      console.log('❌ FAIL: Existing highest bid was corrupted or overwritten.');
    }

    console.log('\n================ AUDIT VERIFICATION COMPLETE ================');

  } catch (err) {
    console.error('Audit Error:', err.message);
  }
}

auditStartingBid();
