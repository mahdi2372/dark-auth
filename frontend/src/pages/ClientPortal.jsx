import React, { useState, useEffect } from 'react';
import { Shield, Key, Download, CheckCircle2, AlertCircle, RefreshCw, Cpu, Clock, Terminal, Clipboard, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientPortal() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [activationData, setActivationData] = useState(null);
  const [hwid, setHwid] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [hwidMode, setHwidMode] = useState('auto');
  const [customHwid, setCustomHwid] = useState('');

  useEffect(() => {
    // Generate or retrieve persistent browser HWID
    let storedHwid = localStorage.getItem('redkey_portal_hwid');
    if (!storedHwid) {
      storedHwid = 'CLIENT-' + Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      localStorage.setItem('redkey_portal_hwid', storedHwid);
    }
    setHwid(storedHwid);

    // Check if previously redeemed
    const savedActivation = localStorage.getItem('redkey_saved_activation');
    if (savedActivation) {
      try {
        setActivationData(JSON.parse(savedActivation));
      } catch {}
    }
  }, []);

  const getActiveHwid = () => {
    if (hwidMode === 'custom' && customHwid.trim()) {
      return customHwid.trim();
    }
    return hwid;
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      toast.error('Please enter a license key.');
      return;
    }

    const activeHwid = getActiveHwid();

    setLoading(true);
    try {
      // Step 1: Initialize session
      const initRes = await fetch('/api/v2/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: import.meta.env.VITE_CLIENT_PORTAL_APP_ID || '',
          secret: import.meta.env.VITE_CLIENT_PORTAL_SECRET || '',
          version: '1.0.0',
        }),
      });
      const initData = await initRes.json();
      
      let sessionToken = initData.session_token;
      if (!sessionToken) {
        const directRes = await fetch('/api/client/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: licenseKey.trim(), hwid: activeHwid }),
        });
        const directData = await directRes.json();
        if (!directRes.ok) throw new Error(directData.error || 'Activation failed');
        setActivationData(directData);
        localStorage.setItem('redkey_saved_activation', JSON.stringify(directData));
        toast.success('License activated successfully!');
        return;
      }

      // Step 2: Validate License
      const licRes = await fetch('/api/v2/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: sessionToken,
          key: licenseKey.trim(),
          hwid: activeHwid,
        }),
      });
      const licData = await licRes.json();
      if (!licData.success) throw new Error(licData.message || 'Invalid license key');

      setActivationData(licData);
      localStorage.setItem('redkey_saved_activation', JSON.stringify(licData));
      toast.success('License validated! Access unlocked.');
    } catch (err) {
      toast.error(err.message || 'Failed to activate license');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem('redkey_saved_activation');
    setActivationData(null);
    setLicenseKey('');
    toast.success('Signed out of client session.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 20%, #1e1114 0%, #0c0a0c 60%, #050505 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top Header */}
      <header style={{
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
        backdropFilter: 'blur(10px)',
        background: 'rgba(12, 10, 12, 0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ef4444, #991b1b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
          }}>
            <Shield size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '1px', color: '#fff' }}>
              DARK<span style={{ color: '#ef4444' }}>AUTH</span>
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Client Activation Portal
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="/dashboard"
            style={{
              fontSize: '13px',
              color: '#9ca3af',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s',
            }}
          >
            Admin Dashboard
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        maxWidth: '840px',
        width: '100%',
        margin: '0 auto',
        padding: '60px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Hero title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
            RedKey Client Activation Engine
          </div>
          <h1 style={{
            fontSize: '42px',
            fontWeight: 900,
            letterSpacing: '-1px',
            marginBottom: '12px',
            background: 'linear-gradient(135deg, #ffffff 40%, #fca5a5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Activate Your Software
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            Enter your product license key below to bind your hardware fingerprint and download the latest software client.
          </p>
        </div>

        {/* Activation Box */}
        {!activationData ? (
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(24, 18, 22, 0.7)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '20px',
            padding: '36px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.1)',
          }}>
            <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#e5e7eb', marginBottom: '8px' }}>
                  PRODUCT LICENSE KEY
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#ef4444',
                  }}>
                    <Key size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      background: 'rgba(10, 8, 10, 0.8)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontFamily: 'monospace',
                      letterSpacing: '1px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                  />
                </div>
              </div>

              {/* HWID / SID Input */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>
                    HARDWARE ID (SID / HWID)
                  </label>
                  <button
                    type="button"
                    onClick={() => setHwidMode(hwidMode === 'auto' ? 'custom' : 'auto')}
                    style={{
                      fontSize: '11px',
                      color: '#f87171',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit3 size={11} />
                    {hwidMode === 'auto' ? 'Enter Manually' : 'Use Auto'}
                  </button>
                </div>
                {hwidMode === 'auto' ? (
                  <div style={{
                    background: 'rgba(10, 8, 10, 0.5)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Cpu size={16} color="#9ca3af" />
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>Auto-detected:</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{ fontSize: '11px', color: '#f87171', fontFamily: 'monospace' }}>
                        {hwid.substring(0, 20)}...
                      </code>
                      <button
                        type="button"
                        onClick={() => { navigator.clipboard.writeText(hwid); toast.success('HWID copied!'); }}
                        style={{
                          background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer',
                          padding: '2px', display: 'flex',
                        }}
                        title="Copy HWID"
                      >
                        <Clipboard size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444',
                      }}>
                        <Cpu size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Paste your Windows SID or HWID here..."
                        value={customHwid}
                        onChange={(e) => setCustomHwid(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '14px 16px 14px 44px',
                          background: 'rgba(10, 8, 10, 0.8)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '12px',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                      Run the PowerShell SID grabber to get your Windows SID, then paste it here.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
                {loading ? 'Validating Key...' : 'Redeem & Activate Key'}
              </button>
            </form>
          </div>
        ) : (
          /* Activated State Display */
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(24, 18, 22, 0.7)',
            border: '1px solid #10b981',
            borderRadius: '20px',
            padding: '36px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={32} color="#10b981" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginBottom: '6px' }}>
                License Active & Verified
              </h2>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                Your client build has been unlocked and bound to this device.
              </p>
            </div>

            <div style={{
              background: 'rgba(10, 8, 10, 0.6)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}>Subscription Level:</span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>Tier {activationData.level || 1} (VIP Access)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}>Status:</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>ACTIVE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}>Expiration:</span>
                <span style={{ color: '#e5e7eb' }}>
                  {activationData.expires_at ? new Date(activationData.expires_at).toLocaleDateString() : 'Lifetime Access'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}>Bound HWID:</span>
                <code style={{ color: '#9ca3af', fontFamily: 'monospace' }}>{getActiveHwid().substring(0, 20)}...</code>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  fontSize: '15px',
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
                onClick={handleClearSession}
                style={{
                  padding: '12px',
                  background: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Activate Different Key
              </button>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          width: '100%',
          marginTop: '60px',
        }}>
          <div style={{
            background: 'rgba(20, 15, 20, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <Cpu size={28} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Hardware Lock</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              Strict cryptographic device binding prevents credential leak and account sharing.
            </p>
          </div>

          <div style={{
            background: 'rgba(20, 15, 20, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <RefreshCw size={28} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Auto Updates</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              Seamless version distribution with checksum anti-tamper and update triggers.
            </p>
          </div>

          <div style={{
            background: 'rgba(20, 15, 20, 0.5)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <Terminal size={28} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>14 Language SDKs</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
              Ready integrations for C#, C++, Python, Rust, Go, Java, Unity, React, and more.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: '#6b7280',
        fontSize: '12px',
      }}>
        DARK-AUTH Platform — 100% Free & Self-Hosted
      </footer>
    </div>
  );
}
