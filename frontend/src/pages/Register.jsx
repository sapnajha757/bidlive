import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';

export default function Register({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    adminCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleRoleChange = (selectedRole) => {
    setFormData({
      ...formData,
      role: selectedRole,
      adminCode: selectedRole === 'user' ? '' : formData.adminCode,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.role === 'admin' && !formData.adminCode.trim()) {
      setError('Admin Registration Code is required for admin accounts.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        adminCode: formData.role === 'admin' ? formData.adminCode.trim() : undefined,
      });

      // Save token and user details to localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      if (onLoginSuccess && response.user) {
        onLoginSuccess(response.user);
        if (response.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-sm text-gray-600 mt-1">Join BidLive to participate in or manage live auctions</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            required
          />

          {/* Account Type Selection */}
          <div className="space-y-2 pt-1">
            <label className="block text-sm font-semibold text-gray-700">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-medium text-sm transition-colors ${
                  formData.role === 'user'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={formData.role === 'user'}
                  onChange={() => handleRoleChange('user')}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                User
              </label>

              <label
                className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer font-medium text-sm transition-colors ${
                  formData.role === 'admin'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={formData.role === 'admin'}
                  onChange={() => handleRoleChange('admin')}
                  className="mr-2 text-indigo-600 focus:ring-indigo-500"
                />
                Admin
              </label>
            </div>
          </div>

          {/* Conditional Admin Registration Code field */}
          {formData.role === 'admin' && (
            <div className="pt-1 animate-fadeIn">
              <Input
                label="Admin Registration Code"
                type="password"
                name="adminCode"
                value={formData.adminCode}
                onChange={handleChange}
                placeholder="Enter admin secret code"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Security code required for administrative privileges.
              </p>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">
            Login here
          </Link>
        </div>

      </div>
    </div>
  );
}
