import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';

export default function BidForm({ currentBid = 0, minIncrement = 100, onPlaceBid, disabled = false }) {
  const minRequiredBid = currentBid + minIncrement;
  const [bidAmount, setBidAmount] = useState(minRequiredBid);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericBid = Number(bidAmount);

    if (isNaN(numericBid) || numericBid <= 0) {
      setError('Please enter a valid bid amount.');
      return;
    }

    if (numericBid < minRequiredBid) {
      setError(`Bid must be at least ${formatCurrency(minRequiredBid)} (Current Bid + Min Increment).`);
      return;
    }

    try {
      setSubmitting(true);
      await onPlaceBid(numericBid);
      // Reset input to next minimum required
      setBidAmount(numericBid + minIncrement);
    } catch (err) {
      setError(err.message || 'Failed to place bid.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Place Your Bid</h3>

      <div className="mb-4 text-sm text-gray-600">
        <p>Current Bid: <span className="font-bold text-gray-900">{formatCurrency(currentBid)}</span></p>
        <p className="text-xs text-gray-500 mt-0.5">Minimum required bid: <span className="font-semibold text-indigo-600">{formatCurrency(minRequiredBid)}</span></p>
      </div>

      <Input
        label="Enter your bid (₹)"
        type="number"
        name="bidAmount"
        value={bidAmount}
        onChange={(e) => {
          setBidAmount(e.target.value);
          setError('');
        }}
        placeholder={`Minimum ${minRequiredBid}`}
        required
        min={minRequiredBid}
        step="1"
        error={error}
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={disabled || submitting}
      >
        {submitting ? 'Placing Bid...' : 'Place Bid'}
      </Button>
    </form>
  );
}
