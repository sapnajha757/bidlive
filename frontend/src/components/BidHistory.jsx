import React from 'react';

export default function BidHistory({ bids = [] }) {
  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Format timestamp
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ', ' + date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="text-base font-bold text-gray-900">Bid History</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
          {bids.length} {bids.length === 1 ? 'Bid' : 'Bids'}
        </span>
      </div>

      {bids.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p className="text-sm">No bids placed yet. Be the first to bid!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {bids.map((bid, index) => {
            const bidderName = bid.user?.name || bid.bidderName || bid.userName || 'Anonymous Bidder';
            const amount = bid.amount || bid.bidAmount || 0;
            const time = bid.createdAt || bid.time || bid.timestamp;

            return (
              <div key={bid._id || bid.id || index} className="px-6 py-3.5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {index === 0 ? '👑' : `#${bids.length - index}`}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{bidderName}</p>
                    <p className="text-xs text-gray-500">{formatDate(time)}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${index === 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {formatCurrency(amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
