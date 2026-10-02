// Base API URL configured from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to build headers with Bearer JWT token if user is logged in
const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Simple fetch wrapper to handle API requests and errors
const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed. Please try again.');
    }

    return data;
  } catch (error) {
    // Re-throw with message
    throw new Error(error.message || 'Network error. Please check backend server.');
  }
};

// API Service object with clean methods
export const api = {
  // Authentication APIs
  register: (userData) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  // Auction APIs
  getAuctions: () => request('/api/auctions'),
  getAdminStats: () => request('/api/auctions/stats'),
  getAuctionById: (id) => request(`/api/auctions/${id}`),
  createAuction: (auctionData) => request('/api/auctions', { method: 'POST', body: JSON.stringify(auctionData) }),
  updateAuction: (id, auctionData) => request(`/api/auctions/${id}`, { method: 'PUT', body: JSON.stringify(auctionData) }),

  // Bidding APIs
  placeBid: (auctionId, amount) => request(`/api/auctions/${auctionId}/bids`, { method: 'POST', body: JSON.stringify({ amount: Number(amount) }) }),
  getAuctionBids: (auctionId) => request(`/api/auctions/${auctionId}/bids`),
  getMyBids: () => request('/api/users/me/bids'),
  getMyWins: () => request('/api/users/me/wins'),
};
