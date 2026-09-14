import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 4) {
      return toast.error('Password must be at least 4 characters');
    }
    if (form.username.trim().length < 3) {
      return toast.error('Username must be at least 3 characters');
    }

    setLoading(true);
    try {
      // Clear any stale local auth state before registering
      logout();

      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      toast.success('Account created successfully! Welcome to DARK-AUTH.');
      navigate('/dashboard');
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 15%, #1e1114 0%, #0c0a0c 60%, #050505 100%)',
      padding: '24px',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(20, 16, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '20px',
        padding: '36px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(239, 68, 68, 0.15)',
      }}>
        {/* Top Back link */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#9ca3af',
              fontSize: '13px',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <ArrowLeft size={14} /> Back to Portal
          </Link>
        </div>

        {/* Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
            marginBottom: '12px',
          }}>
            <Shield size={24} color="#fff" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            margin: 0,
            background: 'linear-gradient(135deg, #ffffff 50%, #fca5a5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            DARK<span style={{ color: '#ef4444' }}>AUTH</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '6px' }}>
            Create your developer account to manage apps and licenses
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#d1d5db', marginBottom: '6px' }}>
              USERNAME
            </label>
            <input
              id="username-input"
              type="text"
              placeholder="Choose a username (min 3 chars)"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
              minLength={3}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(12, 10, 12, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#ef4444')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#d1d5db', marginBottom: '6px' }}>
              EMAIL ADDRESS
            </label>
            <input
              id="email-input"
              type="email"
              placeholder="developer@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(12, 10, 12, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#ef4444')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#d1d5db', marginBottom: '6px' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 4 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={4}
                style={{
                  width: '100%',
                  padding: '12px 40px 12px 14px',
                  background: 'rgba(12, 10, 12, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ef4444')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#d1d5db', marginBottom: '6px' }}>
              CONFIRM PASSWORD
            </label>
            <input
              id="confirm-password-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(12, 10, 12, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#ef4444')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)')}
            />
          </div>

          <button
            id="register-btn"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '14px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(239, 68, 68, 0.35)',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? <span className="loading-spinner" /> : <><UserPlus size={16} /> Complete Registration</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#9ca3af', fontSize: '13px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ef4444', fontWeight: 600, textDecoration: 'none' }}>
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
