import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import BidForm from '../components/BidForm';
import BidHistory from '../components/BidHistory';

export default function AuctionDetails({ user }) {
  const { id } = useParams();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placeBidError, setPlaceBidError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  // Socket.IO Server URL
  const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Fetch Auction details & Bids
  const loadAuctionData = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch auction details
      const auctionData = await api.getAuctionById(id).catch(() => null);

      if (auctionData) {
        setAuction(auctionData);
      } else {
        // Fallback demo auction if backend endpoint not active
        setAuction({
          _id: id,
          title: 'iPhone 15 Pro Max - 256GB',
          description: 'Brand new unopened iPhone 15 Pro Max in Natural Titanium with full warranty.',
          imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
          currentBid: 50000,
          startingBid: 40000,
          minIncrement: 1000,
          status: 'ACTIVE',
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          highestBidder: { name: 'Rahul Sharma' }
        });
      }

      // 2. Fetch bid history
      const bidsData = await api.getAuctionBids(id).catch(() => []);
      if (Array.isArray(bidsData)) {
        setBids(bidsData);
      } else if (bidsData.bids && Array.isArray(bidsData.bids)) {
        setBids(bidsData.bids);
      } else {
        // Fallback sample bids
        setBids([
          { _id: 'b1', bidderName: 'Rahul Sharma', amount: 50000, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
          { _id: 'b2', bidderName: 'Priya Singh', amount: 48000, createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
          { _id: 'b3', bidderName: 'Amit Kumar', amount: 45000, createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
        ]);
      }

    } catch (err) {
      setError(err.message || 'Failed to load auction details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctionData();
  }, [id]);

  // Socket.IO Real-Time Connection
  useEffect(() => {
    if (!id) return;

    // 1. Connect to Socket.IO server
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    // 2. Join auction room
    socket.emit('joinRoom', id);
    socket.emit('joinAuction', id);

    // 3. Listen for "newBid"
    socket.on('newBid', (newBidData) => {
      console.log('Real-time newBid received:', newBidData);
      
      const newAmount = newBidData.amount || newBidData.bidAmount;
      const bidder = newBidData.user || newBidData.bidderName || { name: newBidData.bidderName || 'Anonymous' };

      // 4. Update highest current bid
      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentBid: newAmount,
          highestBidder: typeof bidder === 'string' ? { name: bidder } : bidder,
        };
      });

      // 5. Update bid history list
      setBids((prevBids) => [newBidData, ...prevBids]);

      setSuccessMessage(`New bid of ${formatCurrency(newAmount)} placed!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    });

    // 6. Listen for "auctionEnded"
    socket.on('auctionEnded', (data) => {
      console.log('Auction ended event received:', data);
      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'ENDED',
        };
      });
      setTimeLeft('ENDED');
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, [id]);

  // Countdown Timer
  useEffect(() => {
    if (!auction || !auction.endTime) return;

    const updateTimer = () => {
      const diff = new Date(auction.endTime) - new Date();
      if (diff <= 0) {
        setTimeLeft('ENDED');
        return;
      }

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      setTimeLeft(`${h}:${m}:${s}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [auction?.endTime]);

  // Handle placing a new bid
  const handlePlaceBid = async (amount) => {
    setPlaceBidError('');
    setSuccessMessage('');

    try {
      const response = await api.placeBid(id, amount);

      const placedBid = response.bid || {
        _id: Date.now().toString(),
        amount: amount,
        user: { name: user?.name || user?.email || 'You' },
        createdAt: new Date().toISOString(),
      };

      // Optimistically update UI
      setAuction((prev) => ({
        ...prev,
        currentBid: amount,
        highestBidder: { name: user?.name || user?.email || 'You' },
      }));

      setBids((prev) => [placedBid, ...prev]);
      setSuccessMessage(`Successfully placed bid of ${formatCurrency(amount)}!`);
      setTimeout(() => setSuccessMessage(''), 5000);

    } catch (err) {
      setPlaceBidError(err.message || 'Failed to place bid. Please try again.');
      throw err;
    }
  };

  if (loading) return <Loading message="Loading auction details..." />;
  if (error || !auction) return <div className="max-w-4xl mx-auto p-4"><ErrorMessage message={error || 'Auction not found.'} onRetry={loadAuctionData} /></div>;

  const currentBid = auction.currentBid !== undefined ? auction.currentBid : (auction.startingBid || 0);
  const minIncrement = auction.minIncrement || 100;
  const isEnded = timeLeft === 'ENDED' || auction.status === 'ENDED';
  const winnerName = auction.highestBidder?.name || auction.winner?.name || (bids[0]?.user?.name || bids[0]?.bidderName) || 'No bids yet';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Back Link */}
      <Link to="/" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-6">
        ← Back to Auctions
      </Link>

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md text-emerald-700 text-sm font-medium">
          ✅ {successMessage}
        </div>
      )}

      {placeBidError && (
        <ErrorMessage message={placeBidError} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Image and Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="h-80 bg-gray-100 relative">
              <img
                src={auction.imageUrl || auction.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'}
                alt={auction.title || auction.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isEnded ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isEnded ? 'AUCTION ENDED' : 'LIVE AUCTION'}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{auction.title || auction.name}</h1>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{auction.description}</p>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="text-gray-500 block mb-1">Starting Price</span>
                  <span className="font-semibold text-gray-900 text-sm">{formatCurrency(auction.startingBid)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Min Increment</span>
                  <span className="font-semibold text-gray-900 text-sm">{formatCurrency(minIncrement)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Current Winner</span>
                  <span className="font-semibold text-indigo-600 text-sm truncate block">{winnerName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Time Remaining</span>
                  <span className={`font-mono font-bold text-sm ${isEnded ? 'text-red-600' : 'text-emerald-600'}`}>
                    {timeLeft}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bid History */}
          <BidHistory bids={bids} />

        </div>

        {/* Right Column: Bid Form & Live Status */}
        <div className="space-y-6">
          
          {/* Current Bid Summary Box */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md">
            <span className="text-xs uppercase font-semibold text-indigo-200 tracking-wider">Current Highest Bid</span>
            <div className="text-3xl font-extrabold mt-1">{formatCurrency(currentBid)}</div>
            
            <div className="mt-4 pt-4 border-t border-indigo-500/50 flex justify-between items-center text-xs text-indigo-100">
              <span>Leading Bidder:</span>
              <span className="font-bold text-white bg-indigo-800/60 px-2.5 py-1 rounded-full">{winnerName}</span>
            </div>
          </div>

          {/* Bid Form or Auth Prompt */}
          {isEnded ? (
            <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200 text-center">
              <h4 className="font-bold text-gray-900 mb-1">Auction Closed</h4>
              <p className="text-sm text-gray-600">This auction has ended. Winner is <span className="font-semibold text-indigo-600">{winnerName}</span>.</p>
            </div>
          ) : user ? (
            <BidForm
              currentBid={currentBid}
              minIncrement={minIncrement}
              onPlaceBid={handlePlaceBid}
            />
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs text-center">
              <h4 className="font-bold text-gray-900 mb-2">Want to place a bid?</h4>
              <p className="text-sm text-gray-600 mb-4">Please log in to your account to start bidding on this item.</p>
              <Link
                to="/login"
                className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
              >
                Log In to Bid
              </Link>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
