import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, AppWindow, KeyRound, Package,
  ScrollText, Settings, LogOut, Menu, X, Shield,
  Cloud, Users, Ban, Bell, ExternalLink
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { section: 'Overview', items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/client', icon: ExternalLink, label: 'Client Portal' },
    ]},
    { section: 'Management', items: [
      { to: '/apps', icon: AppWindow, label: 'Applications' },
      { to: '/licenses', icon: KeyRound, label: 'Licenses' },
      { to: '/versions', icon: Package, label: 'Client Versions' },
      { to: '/app-users', icon: Users, label: 'App Users' },
      { to: '/variables', icon: Cloud, label: 'Cloud Variables' },
    ]},
    { section: 'Security & Automation', items: [
      { to: '/blacklist', icon: Ban, label: 'Blacklist' },
      { to: '/webhooks', icon: Bell, label: 'Webhooks' },
      { to: '/logs', icon: ScrollText, label: 'Audit Logs' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ]},
  ];

  return (
    <div className="app-layout">
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Shield size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            DARK-AUTH
          </div>
          <div className="sidebar-subtitle">Licensing Platform</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section} className="sidebar-section">
              <div className="sidebar-section-title">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-username">{user?.username}</div>
              <div className="sidebar-role">{user?.role}</div>
            </div>
          </div>
          <button className="sidebar-link" onClick={handleLogout} style={{ marginTop: 4 }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
