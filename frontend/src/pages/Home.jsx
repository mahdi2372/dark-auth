import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Key, Download, Cpu, CheckCircle2, Terminal, Code2,
  Lock, RefreshCw, Zap, Bell, Database, Users, ArrowRight, ExternalLink,
  UserPlus, LogIn, Check, Copy, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const navigate = useNavigate();
  const { register: authRegister, login: authLogin } = useAuth();

  const [activeTab, setActiveTab] = useState('client'); // 'client' | 'features' | 'sdks' | 'pricing'
  const [authMode, setAuthMode] = useState('redeem'); // 'redeem' | 'client_register' | 'client_login' | 'dev_register'

  // Common fields
  const [licenseKey, setLicenseKey] = useState('');
  const [clientUsername, setClientUsername] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [devUsername, setDevUsername] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [activationData, setActivationData] = useState(null);
  const [hwid, setHwid] = useState('');
  const [selectedSdk, setSelectedSdk] = useState('python');

  useEffect(() => {
    let storedHwid = localStorage.getItem('darkauth_portal_hwid');
    if (!storedHwid) {
      storedHwid = 'CLIENT-' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      localStorage.setItem('darkauth_portal_hwid', storedHwid);
    }
    setHwid(storedHwid);

    const saved = localStorage.getItem('darkauth_saved_activation');
    if (saved) {
      try { setActivationData(JSON.parse(saved)); } catch {}
    }
  }, []);

  // 1. Direct Key Redemption
  const handleActivateKey = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) return toast.error('Please enter a license key.');

    setLoading(true);
    try {
      const initRes = await fetch('/api/v2/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: import.meta.env.VITE_CLIENT_PORTAL_APP_ID || '', secret: import.meta.env.VITE_CLIENT_PORTAL_SECRET || '', version: '1.0.0' }),
      });
      const initData = await initRes.json();
      const sessionToken = initData.session_token;

      const licRes = await fetch('/api/v2/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken, key: licenseKey.trim(), hwid }),
      });
      const licData = await licRes.json();
      if (!licData.success) throw new Error(licData.message || licData.error || 'Invalid license key');

      setActivationData(licData);
      localStorage.setItem('darkauth_saved_activation', JSON.stringify(licData));
      toast.success('License validated! Access unlocked.');
    } catch (err) {
      toast.error(err.message || 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  // 2. Client Registration with License Key (KeyAuth / Authly style)
  const handleClientRegister = async (e) => {
    e.preventDefault();
    if (!clientUsername.trim() || !clientPassword || !licenseKey.trim()) {
      return toast.error('Username, password, and license key are required.');
    }
    if (clientPassword.length < 4) {
      return toast.error('Password must be at least 4 characters.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v2/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: clientUsername.trim(),
          password: clientPassword,
          key: licenseKey.trim(),
          hwid,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Registration failed');
      }

      setActivationData({
        ...data,
        key: licenseKey.trim(),
        username: data.user?.username || clientUsername,
        level: data.user?.level || 1,
        expires_at: data.user?.expires_at,
      });
      localStorage.setItem('darkauth_saved_activation', JSON.stringify(data));
      toast.success('Account registered and license bound successfully!');
    } catch (err) {
      toast.error(err.message || 'Client registration failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Client User Login (KeyAuth / Authly style)
  const handleClientLogin = async (e) => {
    e.preventDefault();
    if (!clientUsername.trim() || !clientPassword) {
      return toast.error('Username and password are required.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/v2/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: clientUsername.trim(),
          password: clientPassword,
          hwid,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      setActivationData({
        ...data,
        username: data.user?.username || clientUsername,
        level: data.user?.level || 1,
        expires_at: data.user?.expires_at,
      });
      localStorage.setItem('darkauth_saved_activation', JSON.stringify(data));
      toast.success('Welcome back! Client session verified.');
    } catch (err) {
      toast.error(err.message || 'Client login failed');
    } finally {
      setLoading(false);
    }
  };

  // 4. Developer / Admin Registration (All-In-One Dashboard Account)
  const handleDevRegister = async (e) => {
    e.preventDefault();
    if (!devUsername.trim() || !devEmail.trim() || !devPassword) {
      return toast.error('All fields are required.');
    }
    if (devPassword.length < 4) {
      return toast.error('Password must be at least 4 characters.');
    }

    setLoading(true);
    try {
      await authRegister({
        username: devUsername.trim(),
        email: devEmail.trim(),
        password: devPassword,
      });
      toast.success('Developer account created! Redirecting to Dashboard...');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const sdkSnippets = {
    python: `# Python SDK
from darkauth import DarkAuth

auth = DarkAuth(app_id="YOUR_APP_ID", secret="YOUR_SECRET")
auth.init()
res = auth.license("XXXXX-XXXXX-XXXXX-XXXXX")
print("Status:", res['status'])
motd = auth.get_var("MOTD")`,

    csharp: `// C# (.NET 6+)
using DarkAuthSdk;

var auth = new DarkAuth("YOUR_APP_ID", "YOUR_SECRET");
await auth.InitAsync();
var res = await auth.LicenseAsync("XXXXX-XXXXX-XXXXX-XXXXX");
Console.WriteLine("License Level: " + res.GetProperty("level"));`,

    cpp: `// C++17 (Windows WinINet / Header-only)
#include "DarkAuth.hpp"

DarkAuthSdk::DarkAuth auth("YOUR_APP_ID", "YOUR_SECRET");
auth.init();
auto res = auth.license("XXXXX-XXXXX-XXXXX-XXXXX");
if (res.success) {
    std::cout << "Unlocked!" << std::endl;
}`,

    rust: `// Rust SDK
use darkauth::DarkAuth;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut auth = DarkAuth::new("YOUR_APP_ID", "YOUR_SECRET", "1.0.0", "YOUR_API_URL");
    auth.init(None).await?;
    let res = auth.license("XXXXX-XXXXX-XXXXX-XXXXX").await?;
    Ok(())
}`,

    javascript: `// JavaScript / TypeScript (Node & Browser)
import DarkAuth from './darkauth.js';

const auth = new DarkAuth({ appId: 'YOUR_APP_ID', secret: 'YOUR_SECRET' });
await auth.init();
const res = await auth.license('XXXXX-XXXXX-XXXXX-XXXXX');
console.log('Authenticated:', res.success);`,

    go: `// Go SDK
package main

import "github.com/darkauth/sdk/go"

func main() {
    client := darkauth.New("YOUR_APP_ID", "YOUR_SECRET", "1.0.0", "")
    client.Init("")
    res, _ := client.License("XXXXX-XXXXX-XXXXX-XXXXX")
}`,

    unity: `// Unity C# (MonoBehaviour)
using DarkAuthUnity;

DarkAuthUnity.Instance.AuthenticateLicense("XXXXX-XXXXX-XXXXX-XXXXX", 
    onSuccess: (res) => Debug.Log("Game Unlocked! Tier: " + res.level),
    onError: (err) => Debug.LogError(err)
);`,

    lua: `-- Lua SDK (FiveM / Roblox / Standalone)
local DarkAuth = require("darkauth")
local auth = DarkAuth.new("YOUR_APP_ID", "YOUR_SECRET")
auth:init()
local res = auth:license("XXXXX-XXXXX-XXXXX-XXXXX")`,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 10%, #1e1114 0%, #0c0a0c 50%, #050505 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Navbar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(12, 10, 12, 0.85)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '18px', letterSpacing: '1px' }}>
              DARK<span style={{ color: '#ef4444' }}>AUTH</span>
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('client')}
            style={{
              background: 'none', border: 'none', color: activeTab === 'client' ? '#ef4444' : '#9ca3af',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Key size={15} /> All-In-One Auth
          </button>
          <button
            onClick={() => setActiveTab('features')}
            style={{
              background: 'none', border: 'none', color: activeTab === 'features' ? '#ef4444' : '#9ca3af',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Zap size={15} /> Features
          </button>
          <button
            onClick={() => setActiveTab('sdks')}
            style={{
              background: 'none', border: 'none', color: activeTab === 'sdks' ? '#ef4444' : '#9ca3af',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Code2 size={15} /> 14 SDKs
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            style={{
              background: 'none', border: 'none', color: activeTab === 'pricing' ? '#ef4444' : '#9ca3af',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Sparkles size={15} /> Plans
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/login"
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            Dashboard Login
          </Link>
          <Link
            to="/register"
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            }}
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* Main Unified Content */}
      <main style={{ flex: 1, maxWidth: '1040px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Unified Hero */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            padding: '6px 16px',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
            All-In-One Unified Authentication & Licensing Platform
          </div>

          <h1 style={{
            fontSize: '46px',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #ffffff 40%, #fca5a5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Unified Authentication & Licensing Platform
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '640px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Unified client key redemption, instant account registration, hardware ID locking, and developer portal.
          </p>

          {/* Quick tab switcher */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px',
            padding: '4px',
            gap: '4px',
          }}>
            {[
              { id: 'client', label: '🔴 Live Activation & Registration' },
              { id: 'features', label: '⚡ Features & Security' },
              { id: 'sdks', label: '💻 14 Language SDKs' },
              { id: 'pricing', label: '💎 Version Tiers' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === tab.id ? '#ef4444' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#9ca3af',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: ALL-IN-ONE CLIENT AUTH & REGISTRATION */}
        {activeTab === 'client' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {!activationData ? (
              <div style={{
                width: '100%',
                maxWidth: '600px',
                background: 'rgba(24, 18, 22, 0.85)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '20px',
                padding: '32px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
              }}>
                {/* Auth sub-mode selector */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '4px',
                  background: 'rgba(10, 8, 10, 0.7)',
                  padding: '4px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  {[
                    { id: 'redeem', label: 'Redeem Key' },
                    { id: 'client_register', label: 'Client Register' },
                    { id: 'client_login', label: 'Client Login' },
                    { id: 'dev_register', label: 'Dev Sign-Up' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAuthMode(m.id)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: 'none',
                        background: authMode === m.id ? '#ef4444' : 'transparent',
                        color: authMode === m.id ? '#ffffff' : '#9ca3af',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        textAlign: 'center',
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Submode 1: Redeem Key */}
                {authMode === 'redeem' && (
                  <div>
                    <div style={{ marginBottom: '6px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fca5a5' }}>
                        Redeem Product Key
                      </h2>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '18px' }}>
                      Enter your license key to bind to this machine and unlock the build.
                    </p>

                    <form onSubmit={handleActivateKey} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '6px' }}>
                          LICENSE KEY
                        </label>
                        <input
                          type="text"
                          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                          value={licenseKey}
                          onChange={(e) => setLicenseKey(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '10px',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <div style={{
                        background: 'rgba(10, 8, 10, 0.5)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Your Device HWID:</span>
                        <code style={{ fontSize: '11px', color: '#f87171', fontFamily: 'monospace' }}>
                          {hwid.substring(0, 16)}...
                        </code>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
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
                        }}
                      >
                        {loading ? <RefreshCw size={16} className="animate-spin" /> : <Shield size={16} />}
                        {loading ? 'Validating...' : 'Redeem & Unlock Software'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Submode 2: Client Registration (KeyAuth / Authly User + Key) */}
                {authMode === 'client_register' && (
                  <div>
                    <div style={{ marginBottom: '6px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fca5a5' }}>
                        Client Registration
                      </h2>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '18px' }}>
                      Register an end-user account with your product license key.
                    </p>

                    <form onSubmit={handleClientRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                          USERNAME
                        </label>
                        <input
                          type="text"
                          placeholder="client_username"
                          value={clientUsername}
                          onChange={(e) => setClientUsername(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                          PASSWORD
                        </label>
                        <input
                          type="password"
                          placeholder="At least 4 characters"
                          value={clientPassword}
                          onChange={(e) => setClientPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                          LICENSE KEY
                        </label>
                        <input
                          type="text"
                          placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                          value={licenseKey}
                          onChange={(e) => setLicenseKey(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          marginTop: '6px',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <UserPlus size={15} />}
                        {loading ? 'Creating Account...' : 'Register Account & Activate Key'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Submode 3: Client Login (KeyAuth Style) */}
                {authMode === 'client_login' && (
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#fca5a5' }}>
                      Client User Login
                    </h2>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '18px' }}>
                      Sign in using your registered client user credentials.
                    </p>

                    <form onSubmit={handleClientLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                          USERNAME
                        </label>
                        <input
                          type="text"
                          placeholder="client_username"
                          value={clientUsername}
                          onChange={(e) => setClientUsername(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                          PASSWORD
                        </label>
                        <input
                          type="password"
                          placeholder="Enter your password"
                          value={clientPassword}
                          onChange={(e) => setClientPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          marginTop: '6px',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <LogIn size={15} />}
                        {loading ? 'Authenticating...' : 'Sign In as Client'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Submode 4: Developer / Admin Portal Registration */}
                {authMode === 'dev_register' && (
                  <div>
                    <div style={{ marginBottom: '6px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fca5a5' }}>
                        Developer Account Registration
                      </h2>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '18px' }}>
                      Create a master developer account to manage apps, create license keys, and view telemetry.
                    </p>

                    <form onSubmit={handleDevRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                          USERNAME
                        </label>
                        <input
                          type="text"
                          placeholder="admin_developer"
                          value={devUsername}
                          onChange={(e) => setDevUsername(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                          EMAIL
                        </label>
                        <input
                          type="email"
                          placeholder="admin@example.com"
                          value={devEmail}
                          onChange={(e) => setDevEmail(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                          PASSWORD
                        </label>
                        <input
                          type="password"
                          placeholder="At least 4 characters"
                          value={devPassword}
                          onChange={(e) => setDevPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: 'rgba(10, 8, 10, 0.8)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          marginTop: '6px',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <Shield size={15} />}
                        {loading ? 'Creating Account...' : 'Register Developer & Open Dashboard'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%',
                maxWidth: '600px',
                background: 'rgba(24, 18, 22, 0.85)',
                border: '1px solid #10b981',
                borderRadius: '20px',
                padding: '36px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <CheckCircle2 size={30} color="#10b981" />
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>
                    Access Granted & Account Active
                  </h2>
                  <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                    {activationData.username ? `Signed in as ${activationData.username}` : 'Your license is verified and bound to this hardware.'}
                  </p>
                </div>

                <div style={{
                  background: 'rgba(10, 8, 10, 0.6)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#9ca3af' }}>Subscription Level:</span>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>Tier {activationData.level || 1}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#9ca3af' }}>Status:</span>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>ACTIVE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#9ca3af' }}>Expiration:</span>
                    <span>{activationData.expires_at ? new Date(activationData.expires_at).toLocaleDateString() : 'Lifetime Access'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#9ca3af' }}>Bound Hardware ID:</span>
                    <code style={{ color: '#f87171', fontSize: '11px' }}>{hwid.substring(0, 16)}...</code>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.error('No download available. Configure a version in the dashboard.');
                    }}
                    style={{
                      padding: '14px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <Download size={18} />
                    Download Authorized Client Build
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('darkauth_saved_activation');
                      setActivationData(null);
                      setLicenseKey('');
                      setClientUsername('');
                      setClientPassword('');
                    }}
                    style={{
                      padding: '10px',
                      background: 'transparent',
                      color: '#9ca3af',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Switch Account / Redeem Another Key
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FEATURES & SECURITY */}
        {activeTab === 'features' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'rgba(24, 18, 22, 0.7)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '24px' }}>
              <Cpu size={28} color="#ef4444" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>HWID Locking</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>
                Machine-level fingerprinting binds licenses to user devices, with admin cooldowns and self-service reset requests.
              </p>
            </div>

            <div style={{ background: 'rgba(24, 18, 22, 0.7)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '24px' }}>
              <Database size={28} color="#ef4444" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Cloud Variables</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>
                Host runtime secrets, server endpoints, and license-restricted strings remotely in the cloud without hardcoding.
              </p>
            </div>

            <div style={{ background: 'rgba(24, 18, 22, 0.7)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '24px' }}>
              <Lock size={28} color="#ef4444" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Anti-Tamper Checks</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>
                Verifies binary SHA-256 checksums on initialization to block cracked, patched, or modified executables.
              </p>
            </div>

            <div style={{ background: 'rgba(24, 18, 22, 0.7)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '24px' }}>
              <Bell size={28} color="#ef4444" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Webhook Alerts</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>
                Instant notifications to Discord with rich embeds whenever a license is redeemed, registered, or banned.
              </p>
            </div>

            <div style={{ background: 'rgba(24, 18, 22, 0.7)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '24px' }}>
              <RefreshCw size={28} color="#ef4444" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Auto-Updater Engine</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>
                Deliver binary updates seamlessly with support for forced updates and grace-period reminder notices.
              </p>
            </div>

            <div style={{ background: 'rgba(24, 18, 22, 0.7)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '24px' }}>
              <Users size={28} color="#ef4444" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>End-User Accounts</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>
                Full username + password auth inside your client applications, linked to product license tiers.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: 14 LANGUAGE SDKS */}
        {activeTab === 'sdks' && (
          <div style={{
            background: 'rgba(24, 18, 22, 0.75)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {Object.keys(sdkSnippets).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedSdk(lang)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: selectedSdk === lang ? '#ef4444' : 'rgba(255,255,255,0.05)',
                    color: selectedSdk === lang ? '#fff' : '#9ca3af',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div style={{ marginTop: '16px', position: 'relative' }}>
              <pre style={{
                background: '#09080a',
                padding: '20px',
                borderRadius: '12px',
                overflowX: 'auto',
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#f87171',
                fontFamily: 'monospace',
              }}>
                {sdkSnippets[selectedSdk]}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sdkSnippets[selectedSdk]);
                  toast.success('Snippet copied to clipboard!');
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PRICING / TIERS */}
        {activeTab === 'pricing' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'rgba(24, 18, 22, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px' }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Community</span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>Free</h3>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>Self-hosted forever with 100% open source code.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                <li>✓ Unlimited applications</li>
                <li>✓ Unlimited license keys</li>
                <li>✓ All 14 client SDKs</li>
                <li>✓ Hardware ID (HWID) binding</li>
              </ul>
              <button
                type="button"
                onClick={() => { setActiveTab('client'); setAuthMode('dev_register'); }}
                style={{ width: '100%', padding: '12px', background: '#262626', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
              >
                Deploy Now
              </button>
            </div>

            <div style={{ background: 'rgba(24, 18, 22, 0.85)', border: '1px solid #ef4444', borderRadius: '20px', padding: '32px', boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)' }}>
              <span style={{ background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Recommended</span>
              <h3 style={{ fontSize: '28px', fontWeight: 800, marginTop: '12px' }}>Pro / Enterprise</h3>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '20px' }}>For commercial software & game studio protection.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#cbd5e1' }}>
                <li>✓ Everything in Community</li>
                <li>✓ Anti-tamper binary hash checks</li>
                <li>✓ Discord & Slack Webhooks</li>
                <li>✓ Cloud Variables storage</li>
                <li>✓ Dedicated client portal</li>
              </ul>
              <button
                type="button"
                onClick={() => { setActiveTab('client'); setAuthMode('dev_register'); }}
                style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                Get Started
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px 32px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: '#6b7280',
        fontSize: '12px',
      }}>
        DARK-AUTH • All-In-One Authentication & Licensing Platform • 100% Free & Open Source
      </footer>
    </div>
  );
}
