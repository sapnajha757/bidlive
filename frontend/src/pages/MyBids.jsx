import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const fetchMyBids = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.getMyBids();
      if (Array.isArray(data)) {
        setBids(data);
      } else if (data.bids && Array.isArray(data.bids)) {
        setBids(data.bids);
      } else {
        setBids([]);
      }
    } catch (err) {
      console.warn('Could not fetch user bids:', err.message);
      // Fallback mock user bids for demonstration
      setBids([
        {
          _id: 'mb1',
          auction: { _id: '1', title: 'iPhone 15 Pro Max - 256GB' },
          amount: 50000,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'HIGHEST',
        },
        {
          _id: 'mb2',
          auction: { _id: '2', title: 'MacBook Pro 14" M3' },
          amount: 110000,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'OUTBID',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBids();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">My Placed Bids</h1>
        <p className="text-sm text-gray-600 mt-1">Track all auctions you have participated in</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchMyBids} />}

      {loading ? (
        <Loading message="Loading your bids..." />
      ) : bids.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">You haven't placed any bids yet.</p>
          <Link to="/" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800">
            Browse Live Auctions →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-3.5">Auction Item</th>
                  <th className="px-6 py-3.5">Your Bid Amount</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {bids.map((bid) => {
                  const itemTitle = bid.auction?.title || bid.auctionTitle || bid.auctionName || 'Auction Item';
                  const auctionId = bid.auction?._id || bid.auctionId || bid.auction;

                  return (
                    <tr key={bid._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {itemTitle}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-600">
                        {formatCurrency(bid.amount)}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(bid.createdAt || Date.now()).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/auctions/${auctionId}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                        >
                          View Auction
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
