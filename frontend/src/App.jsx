import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auctions from './pages/Auctions';
import AuctionDetails from './pages/AuctionDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBids from './pages/MyBids';
import MyWins from './pages/MyWins';
import Admin from './pages/Admin';

export default function App() {
  const [user, setUser] = useState(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        
        {/* Navigation Bar */}
        <Navbar user={user} onLogout={handleLogout} />
        
        {/* Page Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Auctions />} />
            <Route path="/auctions" element={<Auctions />} />
            <Route path="/auctions/:id" element={<AuctionDetails user={user} />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<Register onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/my-bids" element={user ? <MyBids /> : <Navigate to="/login" replace />} />
            <Route path="/my-wins" element={user ? <MyWins /> : <Navigate to="/login" replace />} />
            <Route path="/admin" element={user && user.role === 'admin' ? <Admin /> : <Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 mt-12">
          <p>© {new Date().getFullYear()} BidLive Real-Time Multi-Auction System. Built with React + Vite + Tailwind CSS.</p>
        </footer>

      </div>
    </Router>
  );
}
