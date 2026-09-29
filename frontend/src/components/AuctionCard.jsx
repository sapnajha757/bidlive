import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function AuctionCard({ auction }) {
  const {
    _id,
    id,
    title,
    name,
    description,
    imageUrl,
    image,
    currentBid,
    startingBid,
    minIncrement,
    status = 'ACTIVE',
    endTime,
  } = auction;

  const auctionId = _id || id;
  const itemName = title || name || 'Auction Item';
  const displayImage = imageUrl || image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
  const bidAmount = currentBid !== undefined ? currentBid : (startingBid || 0);
  const increment = auction.minimumIncrement || auction.minIncrement || minIncrement || 100;

  // Format currency in INR (₹)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Remaining time timer logic
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!endTime) {
      setTimeLeft('N/A');
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(endTime) - new Date();
      if (difference <= 0) {
        setTimeLeft('ENDED');
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const h = String(hours).padStart(2, '0');
      const m = String(minutes).padStart(2, '0');
      const s = String(seconds).padStart(2, '0');

      setTimeLeft(`${h}:${m}:${s}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  // Status badge style
  const getStatusBadge = () => {
    const isEnded = timeLeft === 'ENDED' || status === 'ENDED';
    if (isEnded) {
      return <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">CLOSED</span>;
    }
    return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">ACTIVE</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Item Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={displayImage}
          alt={itemName}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
          }}
        />
        <div className="absolute top-3 right-3">
          {getStatusBadge()}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">{itemName}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description || 'No description provided.'}</p>
          
          {/* Auction Info Grid */}
          <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-2 mb-4 text-xs">
            <div>
              <span className="text-gray-500 block">Current Bid</span>
              <span className="text-sm font-bold text-indigo-600">{formatCurrency(bidAmount)}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Min Increment</span>
              <span className="text-sm font-semibold text-gray-700">{formatCurrency(increment)}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-gray-500 font-medium">Time Left:</span>
              <span className={`font-mono font-bold ${timeLeft === 'ENDED' ? 'text-red-600' : 'text-emerald-600'}`}>
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* View Auction Button */}
        <Link
          to={`/auctions/${auctionId}`}
          className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          View Auction
        </Link>
      </div>
    </div>
  );
}
