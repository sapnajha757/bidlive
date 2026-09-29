import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AuctionCard from '../components/AuctionCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

// Mock sample auctions for demonstration if backend is not active
const MOCK_AUCTIONS = [
  {
    _id: '1',
    title: 'iPhone 15 Pro Max - 256GB',
    description: 'Brand new unopened iPhone 15 Pro Max in Natural Titanium with full Apple warranty.',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    currentBid: 50000,
    startingBid: 40000,
    minimumIncrement: 1000,
    minIncrement: 1000,
    status: 'ACTIVE',
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
  },
  {
    _id: '2',
    title: 'MacBook Pro 14" M3',
    description: 'Space Black MacBook Pro with M3 Chip, 16GB RAM, 512GB SSD. Mint condition.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    currentBid: 120000,
    startingBid: 100000,
    minimumIncrement: 2000,
    minIncrement: 2000,
    status: 'ACTIVE',
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '3',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Industry-leading noise cancelling headphones with microphone and touch controls.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    currentBid: 18000,
    startingBid: 15000,
    minimumIncrement: 500,
    minIncrement: 500,
    status: 'ACTIVE',
    endTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
  },
  {
    _id: '4',
    title: 'PlayStation 5 Console (Digital Edition)',
    description: 'PlayStation 5 Console with DualSense Wireless Controller. Includes 2 games.',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    currentBid: 35000,
    startingBid: 30000,
    minimumIncrement: 1000,
    minIncrement: 1000,
    status: 'ACTIVE',
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  }
];

export default function Auctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAuctions = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.getAuctions();
      if (Array.isArray(data) && data.length > 0) {
        setAuctions(data);
      } else if (data.auctions && Array.isArray(data.auctions) && data.auctions.length > 0) {
        setAuctions(data.auctions);
      } else {
        // If API returns empty list or fails, load fallback mock data for demo
        setAuctions(MOCK_AUCTIONS);
      }
    } catch (err) {
      console.warn('API error, using sample demo auctions:', err.message);
      // Fallback to sample demo data so user can test UI immediately
      setAuctions(MOCK_AUCTIONS);
      setError('Could not connect to live backend API. Displaying sample auctions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Live Auctions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Browse and bid on exclusive real-time auctions
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Real-time Socket.IO Active
          </span>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAuctions} />}

      {loading ? (
        <Loading message="Fetching available auctions..." />
      ) : auctions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-lg font-medium">No active auctions available right now.</p>
          <p className="text-sm text-gray-400 mt-1">Check back later or log in as Admin to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctions.map((auction) => (
            <AuctionCard key={auction._id || auction.id} auction={auction} />
          ))}
        </div>
      )}

    </div>
  );
}
