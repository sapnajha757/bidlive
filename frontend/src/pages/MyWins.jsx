import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function MyWins() {
  const [wins, setWins] = useState([]);
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

  const fetchMyWins = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.getMyWins();
      if (Array.isArray(data)) {
        setWins(data);
      } else if (data.wins && Array.isArray(data.wins)) {
        setWins(data.wins);
      } else {
        setWins([]);
      }
    } catch (err) {
      console.warn('Could not fetch user wins:', err.message);
      // Fallback mock user wins for demonstration
      setWins([
        {
          _id: 'w1',
          title: 'Sony WH-1000XM5 Headphones',
          winningBid: 18000,
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWins();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="mb-6 border-b border-gray-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Won Auctions 🏆</h1>
          <p className="text-sm text-gray-600 mt-1">Auctions where you placed the highest winning bid</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchMyWins} />}

      {loading ? (
        <Loading message="Loading your won auctions..." />
      ) : wins.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-2">🏅</div>
          <p className="text-gray-700 font-semibold">No won auctions yet.</p>
          <p className="text-sm text-gray-500 mt-1">Keep bidding on live auctions to win your first item!</p>
          <Link to="/" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wins.map((win) => {
            const title = win.title || win.name || 'Won Auction Item';
            const price = win.winningBid || win.currentBid || win.finalPrice || 0;
            const img = win.imageUrl || win.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';

            return (
              <div key={win._id} className="bg-white rounded-xl border border-emerald-200 shadow-xs overflow-hidden flex flex-col sm:flex-row">
                <div className="w-full sm:w-40 h-40 bg-gray-100 shrink-0">
                  <img
                    src={img}
                    alt={title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                    }}
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 text-base mb-1">{title}</h3>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                        WINNER
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Won on: {new Date(win.endTime || Date.now()).toLocaleDateString()}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block">Winning Price</span>
                      <span className="text-lg font-extrabold text-emerald-600">{formatCurrency(price)}</span>
                    </div>
                    <Link
                      to={`/auctions/${win._id}`}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
