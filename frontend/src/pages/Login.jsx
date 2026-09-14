import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-logo">
          <h1><Shield size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />DARK-AUTH</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <input
              id="login-input"
              className="form-input"
              type="text"
              placeholder="Enter username or email"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="password-input"
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button id="login-btn" className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? <span className="loading-spinner" /> : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
