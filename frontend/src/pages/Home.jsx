import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Lock, RefreshCw, Bell, Database, Users,
  Copy, ChevronRight, ArrowRight, Check,
  Key, Fingerprint, Server,
} from 'lucide-react';
import toast from 'react-hot-toast';

function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(239, 68, 68, ${0.06 * (1 - dist / 150)})`;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

function AnimatedCounter({ target, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          setCount(Math.floor(progress * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        tick();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count}</span>;
}

export default function Home() {
  const [selectedSdk, setSelectedSdk] = useState('python');
  const [visibleSection, setVisibleSection] = useState({});

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setVisibleSection(prev => ({ ...prev, [e.target.id]: true }));
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const sdkSnippets = {
    python: `from darkauth import DarkAuth

auth = DarkAuth(app_id="YOUR_APP_ID", secret="YOUR_SECRET")
auth.init()
res = auth.license("XXXXX-XXXXX-XXXXX-XXXXX")
print("Status:", res['status'])`,
    csharp: `using DarkAuthSdk;

var auth = new DarkAuth("YOUR_APP_ID", "YOUR_SECRET");
await auth.InitAsync();
var res = await auth.LicenseAsync("XXXXX-XXXXX-XXXXX-XXXXX");
Console.WriteLine("Level: " + res.GetProperty("level"));`,
    cpp: `#include "DarkAuth.hpp"

DarkAuthSdk::DarkAuth auth("YOUR_APP_ID", "YOUR_SECRET");
auth.init();
auto res = auth.license("XXXXX-XXXXX-XXXXX-XXXXX");
if (res.success) std::cout << "Unlocked!";`,
    rust: `use darkauth::DarkAuth;

let mut auth = DarkAuth::new("APP_ID", "SECRET", "1.0.0", "API_URL");
auth.init(None).await?;
let res = auth.license("XXXXX-XXXXX-XXXXX-XXXXX").await?;`,
    javascript: `import DarkAuth from './darkauth.js';

const auth = new DarkAuth({ appId: 'APP_ID', secret: 'SECRET' });
await auth.init();
const res = await auth.license('XXXXX-XXXXX-XXXXX-XXXXX');
console.log('Authenticated:', res.success);`,
    go: `client := darkauth.New("APP_ID", "SECRET", "1.0.0", "")
client.Init("")
res, _ := client.License("XXXXX-XXXXX-XXXXX-XXXXX")`,
    unity: `DarkAuthUnity.Instance.AuthenticateLicense(
  "XXXXX-XXXXX-XXXXX-XXXXX",
  onSuccess: (res) => Debug.Log("Unlocked! Tier: " + res.level),
  onError: (err) => Debug.LogError(err)
);`,
    lua: `local DarkAuth = require("darkauth")
local auth = DarkAuth.new("APP_ID", "SECRET")
auth:init()
local res = auth:license("XXXXX-XXXXX-XXXXX-XXXXX")`,
  };

  const features = [
    { icon: Key, title: 'License Management', desc: 'Generate, validate, and manage license keys with time-limited, lifetime, and trial types.' },
    { icon: Fingerprint, title: 'HWID Locking', desc: 'Bind licenses to hardware fingerprints. Block piracy with machine-level device binding.' },
    { icon: Database, title: 'Cloud Variables', desc: 'Store and sync runtime config, feature flags, and secrets from the cloud.' },
    { icon: Lock, title: 'Anti-Tamper', desc: 'Binary SHA-256 checksum verification blocks cracked and modified executables.' },
    { icon: Bell, title: 'Webhook Alerts', desc: 'Real-time Discord & Slack notifications for activations, bans, and registrations.' },
    { icon: RefreshCw, title: 'Auto-Updater', desc: 'Seamless version distribution with forced updates and grace period notices.' },
    { icon: Users, title: 'User Management', desc: 'Full username + password auth inside your apps, tied to license tiers.' },
    { icon: Server, title: 'REST API', desc: 'Developer-friendly API for licensing, validation, automation, and analytics.' },
  ];

  const stats = [
    { value: 14, suffix: '+', label: 'Language SDKs' },
    { value: 100, suffix: '%', label: 'Open Source' },
    { value: 0, suffix: '', label: 'Cost (Free)' },
    { value: 24, suffix: '/7', label: 'Self-Hosted' },
  ];

  const fadeUp = (id) => ({
    id,
    'data-animate': 'true',
    style: {
      opacity: visibleSection[id] ? 1 : 0,
      transform: visibleSection[id] ? 'translateY(0)' : 'translateY(40px)',
      transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    },
  });

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#fff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' }}>
      <ParticleField />

      {/* Navbar */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #ef4444, #991b1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
            <Shield size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '1px' }}>DARK<span style={{ color: '#ef4444' }}>AUTH</span></span>
        </div>
        <nav style={{ display: 'flex', gap: '6px', position: 'relative', zIndex: 1 }}>
          {['features', 'sdks', 'pricing'].map(id => (
            <a key={id} href={`#${id}`} style={{ padding: '8px 18px', borderRadius: '8px', color: '#9ca3af', textDecoration: 'none', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.target.style.color = '#9ca3af'; e.target.style.background = 'transparent'; }}>
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/login" style={{ padding: '8px 20px', borderRadius: '8px', color: '#9ca3af', textDecoration: 'none', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s' }}>Sign In</a>
          <a href="/register" style={{ padding: '8px 20px', borderRadius: '8px', color: '#fff', textDecoration: 'none', fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg, #ef4444, #b91c1c)', boxShadow: '0 4px 15px rgba(239,68,68,0.3)' }}>Get Started</a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 60px', textAlign: 'center' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '40px', padding: '6px 18px', marginBottom: '24px',
          animation: 'fadeInDown 0.8s ease',
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#f87171' }}>100% Free & Open Source</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 900, letterSpacing: '-2px',
          lineHeight: 1.1, marginBottom: '20px',
          background: 'linear-gradient(135deg, #ffffff 30%, #fca5a5 70%, #ef4444 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'fadeInUp 0.8s ease',
        }}>
          Protect Your<br />Software
        </h1>

        <p style={{ color: '#9ca3af', fontSize: '17px', maxWidth: '520px', lineHeight: 1.7, marginBottom: '36px', animation: 'fadeInUp 0.8s ease 0.1s both' }}>
          License generation, hardware ID locking, auto-updates, and cloud variables. Built for developers, by developers.
        </p>

        <div style={{ display: 'flex', gap: '12px', animation: 'fadeInUp 0.8s ease 0.2s both' }}>
          <a href="/register" style={{
            padding: '14px 32px', borderRadius: '12px', color: '#fff', textDecoration: 'none',
            fontSize: '15px', fontWeight: 700, background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            boxShadow: '0 8px 30px rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.3s', transform: 'translateY(0)',
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 40px rgba(239,68,68,0.45)'; }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 8px 30px rgba(239,68,68,0.35)'; }}>
            Start Building <ArrowRight size={16} />
          </a>
          <a href="#features" style={{
            padding: '14px 32px', borderRadius: '12px', color: '#e5e7eb', textDecoration: 'none',
            fontSize: '15px', fontWeight: 600, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            Learn More <ChevronRight size={16} />
          </a>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', marginTop: '72px', width: '100%', maxWidth: '640px', animation: 'fadeInUp 0.8s ease 0.3s both' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: '#ef4444' }}><AnimatedCounter target={s.value} />{s.suffix}</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: '30px', animation: 'bounce 2s infinite' }}>
          <ChevronRight size={20} color="#6b7280" style={{ transform: 'rotate(90deg)' }} />
        </div>
      </section>

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0) rotate(90deg); } 50% { transform: translateY(8px) rotate(90deg); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(239,68,68,0.2); } 50% { box-shadow: 0 0 40px rgba(239,68,68,0.4); } }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '0 24px' }}>

        {/* Features */}
        <section id="features" {...fadeUp('features')} style={{ padding: '80px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '3px' }}>Features</span>
            <h2 style={{ fontSize: '36px', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px' }}>Everything You Need</h2>
            <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '8px' }}>Complete licensing platform with enterprise-grade security</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(24, 18, 22, 0.6)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px', padding: '28px 24px', transition: 'all 0.3s',
                cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <f.icon size={20} color="#ef4444" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '13px', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Code Section */}
        <section id="sdks" {...fadeUp('sdks')} style={{ padding: '80px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '3px' }}>SDKs</span>
            <h2 style={{ fontSize: '36px', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px' }}>14 Language SDKs</h2>
            <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '8px' }}>Integrate with any language in minutes</p>
          </div>
          <div style={{
            background: 'rgba(24, 18, 22, 0.6)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px', padding: '24px', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', marginBottom: '20px' }}>
              {Object.keys(sdkSnippets).map(lang => (
                <button key={lang} onClick={() => setSelectedSdk(lang)} style={{
                  padding: '7px 16px', borderRadius: '8px', border: 'none', flexShrink: 0,
                  background: selectedSdk === lang ? '#ef4444' : 'rgba(255,255,255,0.04)',
                  color: selectedSdk === lang ? '#fff' : '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  textTransform: 'uppercase', transition: 'all 0.2s',
                }}>{lang}</button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <pre style={{
                background: '#09080a', padding: '24px', borderRadius: '12px',
                overflowX: 'auto', fontSize: '14px', lineHeight: 1.7, color: '#f87171',
                fontFamily: '"Fira Code", "JetBrains Mono", monospace', margin: 0,
              }}>{sdkSnippets[selectedSdk]}</pre>
              <button onClick={() => { navigator.clipboard.writeText(sdkSnippets[selectedSdk]); toast.success('Copied!'); }}
                style={{ position: 'absolute', top: '12px', right: '12px', padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Copy size={12} /> Copy
              </button>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" {...fadeUp('pricing')} style={{ padding: '80px 0 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '3px' }}>Pricing</span>
            <h2 style={{ fontSize: '36px', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px' }}>Free Forever</h2>
            <p style={{ color: '#6b7280', fontSize: '15px', marginTop: '8px' }}>Self-hosted, open source, no hidden fees</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(24,18,22,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '32px' }}>
              <span style={{ background: 'rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#9ca3af' }}>Community</span>
              <div style={{ fontSize: '40px', fontWeight: 900, marginTop: '16px' }}>Free</div>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '8px 0 24px' }}>Self-hosted with full source code</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Unlimited applications', 'Unlimited license keys', 'All 14 SDKs', 'HWID binding'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#9ca3af' }}>
                    <Check size={14} color="#ef4444" /> {item}
                  </li>
                ))}
              </ul>
              <a href="/register" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>Deploy Now</a>
            </div>
            <div style={{ background: 'rgba(24,18,22,0.85)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '20px', padding: '32px', boxShadow: '0 0 40px rgba(239,68,68,0.08)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
              <span style={{ background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Full Stack</span>
              <div style={{ fontSize: '40px', fontWeight: 900, marginTop: '16px' }}>Included</div>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '8px 0 24px' }}>Everything, no restrictions</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Everything in Community', 'Anti-tamper hash checks', 'Discord & Slack Webhooks', 'Cloud Variables', 'Auto-Updater engine'].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#e5e7eb' }}>
                    <Check size={14} color="#ef4444" /> {item}
                  </li>
                ))}
              </ul>
              <a href="/register" style={{ display: 'block', textAlign: 'center', padding: '12px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px', boxShadow: '0 6px 20px rgba(239,68,68,0.3)' }}>Get Started</a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="#ef4444" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280' }}>DARK<span style={{ color: '#ef4444' }}>AUTH</span></span>
          </div>
          <div style={{ fontSize: '12px', color: '#4b5563' }}>
            100% Free & Open Source &bull; Built for Developers
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="https://github.com/mahdi2372/dark-auth" target="_blank" rel="noopener" style={{ color: '#4b5563', textDecoration: 'none', fontSize: '12px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#ef4444'} onMouseLeave={e => e.target.style.color = '#4b5563'}>GitHub</a>
            <a href="/login" style={{ color: '#4b5563', textDecoration: 'none', fontSize: '12px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#ef4444'} onMouseLeave={e => e.target.style.color = '#4b5563'}>Dashboard</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
