import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="bg-indigo-600 text-white p-2 rounded-lg text-lg font-bold">⚡</span>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Bid<span className="text-indigo-600">Live</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex ml-10 space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') || isActive('/auctions')
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Auctions
              </Link>
              
              {user && (
                <>
                  <Link
                    to="/my-bids"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/my-bids')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Bids
                  </Link>

                  <Link
                    to="/my-wins"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/my-wins')
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    My Wins
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin')
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold'
                      }`}
                    >
                      Admin Panel
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                  👤 {user.name || user.email}
                </span>
                <button
                  onClick={handleLogoutClick}
                  className="px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
          >
            Auctions
          </Link>
          {user ? (
            <>
              <Link
                to="/my-bids"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                My Bids
              </Link>
              <Link
                to="/my-wins"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                My Wins
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-indigo-600 hover:bg-indigo-50"
                >
                  Admin Panel
                </Link>
              )}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">👤 {user.name || user.email}</span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogoutClick();
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-sm font-medium text-gray-700 rounded-md"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-gray-700 bg-gray-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-3 py-2 rounded-md text-base font-medium text-white bg-indigo-600"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
