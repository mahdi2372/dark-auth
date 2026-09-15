import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Cpu, Lock, RefreshCw, Zap, Bell, Database, Users,
  UserPlus, Terminal, Code2, Check, Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();

  const [activeTab, setActiveTab] = useState('features'); // 'features' | 'sdks' | 'pricing'
  const [devUsername, setDevUsername] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSdk, setSelectedSdk] = useState('python');

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
      toast.success('Account created! Redirecting to Dashboard...');
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
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
          }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '1px' }}>
              DARK<span style={{ color: '#ef4444' }}>AUTH</span>
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'features', label: 'Features' },
            { id: 'sdks', label: 'SDKs' },
            { id: 'pricing', label: 'Pricing' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab.id ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeTab === tab.id ? '#ef4444' : '#9ca3af',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a href="/login" style={{
            fontSize: '13px',
            color: '#9ca3af',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            Sign In
          </a>
          <a href="/register" style={{
            fontSize: '13px',
            color: '#fff',
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#ef4444',
            fontWeight: 600,
          }}>
            Get Started
          </a>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '48px 24px' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
            Open Source Licensing Platform
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
            Protect Your Software
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '560px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            License generation, hardware ID locking, auto-updates, and cloud variables. Built for developers, by developers.
          </p>

          {/* Developer Registration Form */}
          <div style={{
            maxWidth: '440px',
            margin: '0 auto',
            background: 'rgba(24, 18, 22, 0.85)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
          }}>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#fca5a5' }}>
                Create Developer Account
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                Start managing licenses in minutes. Free & self-hosted.
              </p>
            </div>

            <form onSubmit={handleDevRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#e5e7eb', marginBottom: '4px' }}>
                  USERNAME
                </label>
                <input
                  type="text"
                  placeholder="your_username"
                  value={devUsername}
                  onChange={(e) => setDevUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(10, 8, 10, 0.8)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
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
                  placeholder="you@example.com"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(10, 8, 10, 0.8)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
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
                  placeholder="Min 4 characters"
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'rgba(10, 8, 10, 0.8)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '4px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
                }}
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {loading ? 'Creating Account...' : 'Create Account & Go to Dashboard'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#6b7280' }}>
              Already have an account? <a href="/login" style={{ color: '#ef4444', textDecoration: 'none' }}>Sign in</a>
            </p>
          </div>
        </div>

        {/* TAB: FEATURES & SECURITY */}
        {activeTab === 'features' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              { icon: Cpu, title: 'HWID Locking', desc: 'Machine-level fingerprinting binds licenses to user devices, with admin cooldowns and self-service reset requests.' },
              { icon: Database, title: 'Cloud Variables', desc: 'Host runtime secrets, server endpoints, and license-restricted strings remotely in the cloud without hardcoding.' },
              { icon: Lock, title: 'Anti-Tamper Checks', desc: 'Verifies binary SHA-256 checksums on initialization to block cracked, patched, or modified executables.' },
              { icon: Bell, title: 'Webhook Alerts', desc: 'Instant notifications to Discord with rich embeds whenever a license is activated, registered, or banned.' },
              { icon: RefreshCw, title: 'Auto-Updater Engine', desc: 'Deliver binary updates seamlessly with support for forced updates and grace-period reminder notices.' },
              { icon: Users, title: 'End-User Accounts', desc: 'Full username + password auth inside your client applications, linked to product license tiers.' },
              { icon: Zap, title: '14 Language SDKs', desc: 'Python, C#, C++, Rust, Go, Java, JavaScript, Unity, Lua, PHP, Ruby, Perl, React, Vue.' },
              { icon: Terminal, title: 'REST API', desc: 'Full developer API for licensing, validation, automation and analytics with detailed documentation.' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'rgba(24, 18, 22, 0.7)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '24px' }}>
                <f.icon size={28} color="#ef4444" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB: SDKs */}
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
                  toast.success('Snippet copied!');
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
                <Copy size={14} />
              </button>
            </div>
          </div>
        )}

        {/* TAB: PRICING */}
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
                onClick={() => setActiveTab('features')}
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
                onClick={() => setActiveTab('features')}
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
        DARK-AUTH &bull; All-In-One Authentication & Licensing Platform &bull; 100% Free &amp; Open Source
      </footer>
    </div>
  );
}
