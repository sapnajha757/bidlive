import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

export default function Admin() {
  const [auctions, setAuctions] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAuctions: 0,
    activeAuctions: 0,
    endedAuctions: 0,
    totalBids: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State for Creating/Updating Auction
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    startingBid: '',
    minIncrement: '100',
    endTime: '',
  });

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.getAdminStats();
      if (data) {
        setStats({
          totalUsers: data.totalUsers || 0,
          totalAuctions: data.totalAuctions || 0,
          activeAuctions: data.activeAuctions || 0,
          endedAuctions: data.endedAuctions || 0,
          totalBids: data.totalBids || 0,
        });
      }
    } catch (err) {
      console.warn('Could not fetch admin stats:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAuctions = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.getAuctions();
      if (Array.isArray(data)) {
        setAuctions(data);
      } else if (data.auctions && Array.isArray(data.auctions)) {
        setAuctions(data.auctions);
      } else {
        setAuctions([]);
      }
    } catch (err) {
      console.warn('Backend API error in Admin, using demo list:', err.message);
      setAuctions([
        {
          _id: '1',
          title: 'iPhone 15 Pro Max',
          startingBid: 40000,
          currentBid: 50000,
          minIncrement: 1000,
          status: 'ACTIVE',
          endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAuctions();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.startingBid || !formData.endTime) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsCreating(true);
      
      const payload = {
        title: formData.title,
        name: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        image: formData.imageUrl,
        startingBid: Number(formData.startingBid),
        minimumIncrement: Number(formData.minIncrement || 100),
        minIncrement: Number(formData.minIncrement || 100),
        endTime: new Date(formData.endTime).toISOString(),
      };

      if (editingId) {
        await api.updateAuction(editingId, payload);
        setSuccess('Auction updated successfully!');
      } else {
        await api.createAuction(payload);
        setSuccess('New auction created successfully!');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        startingBid: '',
        minIncrement: '100',
        endTime: '',
      });
      setEditingId(null);

      // Refresh list & stats
      fetchAuctions();
      fetchStats();

      setTimeout(() => setSuccess(''), 4000);

    } catch (err) {
      setError(err.message || 'Failed to save auction.');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (auction) => {
    setEditingId(auction._id || auction.id);
    setFormData({
      title: auction.title || auction.name || '',
      description: auction.description || '',
      imageUrl: auction.imageUrl || auction.image || '',
      startingBid: auction.startingPrice !== undefined ? auction.startingPrice : (auction.startingBid || ''),
      minIncrement: auction.minimumIncrement !== undefined ? auction.minimumIncrement : (auction.minIncrement || '100'),
      endTime: auction.endTime ? new Date(auction.endTime).toISOString().slice(0, 16) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      startingBid: '',
      minIncrement: '100',
      endTime: '',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="mb-8 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard ⚙️</h1>
        <p className="text-sm text-gray-600 mt-1">System analytics, auction management, and listing controls</p>
      </div>

      {/* Live Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">
            {statsLoading ? '...' : stats.totalUsers}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Auctions</div>
          <div className="text-2xl font-bold text-indigo-600">
            {statsLoading ? '...' : stats.totalAuctions}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Active Auctions</div>
          <div className="text-2xl font-bold text-emerald-600">
            {statsLoading ? '...' : stats.activeAuctions}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Ended Auctions</div>
          <div className="text-2xl font-bold text-amber-600">
            {statsLoading ? '...' : stats.endedAuctions}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Total Bids</div>
          <div className="text-2xl font-bold text-purple-600">
            {statsLoading ? '...' : stats.totalBids}
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-md text-emerald-700 text-sm font-medium">
          ✅ {success}
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create/Edit Auction Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs sticky top-20">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? 'Edit Auction' : 'Create New Auction'}
            </h2>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <Input
                label="Item Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. iPhone 15 Pro"
                required
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter item specs and details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-900"
                ></textarea>
              </div>

              <Input
                label="Image URL"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/item.jpg"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Starting Bid (₹)"
                  type="number"
                  name="startingBid"
                  value={formData.startingBid}
                  onChange={handleChange}
                  placeholder="5000"
                  required
                  min="1"
                />

                <Input
                  label="Min Increment (₹)"
                  type="number"
                  name="minIncrement"
                  value={formData.minIncrement}
                  onChange={handleChange}
                  placeholder="100"
                  required
                  min="1"
                />
              </div>

              <Input
                label="Auction End Date & Time"
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={isCreating}
                >
                  {isCreating ? 'Saving...' : editingId ? 'Update Auction' : 'Create Auction'}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={cancelEdit}
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Manage Auctions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">All Auctions</h2>

            {loading ? (
              <Loading message="Loading existing auctions..." />
            ) : auctions.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">No auctions created yet.</p>
            ) : (
              <div className="space-y-4">
                {auctions.map((item) => {
                  const startPrice = item.startingPrice !== undefined ? item.startingPrice : item.startingBid;
                  const current = item.currentBid !== undefined ? item.currentBid : startPrice;

                  return (
                    <div
                      key={item._id || item.id}
                      className="p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.imageUrl || item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                          alt={item.title || item.name}
                          className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{item.title || item.name}</h4>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                            <span>Start: {formatCurrency(startPrice)}</span>
                            <span>•</span>
                            <span className="font-semibold text-indigo-600">Current: {formatCurrency(current)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 justify-end">
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
