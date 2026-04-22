import React, { useState } from 'react';
import { Box, Menu, X, ChevronRight, LogOut } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { VerifierComponent } from './components/VerifierComponent';
import { StudentDashboard } from './components/StudentDashboard';
import { AuthPage } from './components/AuthPage';
import { LandingPage, FeaturesPage, HowItWorksPage, AboutPage, ContactPage } from './components/MarketingPages';
import { UserRole, UserProfile } from './types';

type PageView = 'home' | 'features' | 'how-it-works' | 'about' | 'contact' | 'dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [activeRole, setActiveRole] = useState<UserRole>('ADMIN');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigateTo = (page: any, role?: string) => {
    setCurrentPage(page);
    if (role) setActiveRole(role as UserRole);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigateTo('home');
  };

  const renderDashboard = () => {
    if (!currentUser) return <AuthPage onLogin={setCurrentUser} />;
    if (currentUser.role === 'ADMIN') return <AdminDashboard user={currentUser} />;
    if (currentUser.role === 'VERIFIER') return <VerifierComponent user={currentUser} />;
    if (currentUser.role === 'STUDENT') return <StudentDashboard user={currentUser} />;
    return null;
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home': return <LandingPage onNavigate={navigateTo} />;
      case 'features': return <FeaturesPage />;
      case 'how-it-works': return <HowItWorksPage />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      case 'dashboard': return renderDashboard();
      default: return <LandingPage onNavigate={navigateTo} />;
    }
  };

  const navLinks: [string, string][] = [
    ['home', 'Home'],
    ['features', 'Features'],
    ['how-it-works', 'How It Works'],
    ['about', 'About'],
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg,#00c9a7 0%,#00b09b 30%,#1dd3a0 65%,#43e97b 100%)',
      fontFamily: "'Poppins','Segoe UI',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .nav-btn { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.75); font-size: 0.875rem; font-weight: 600; font-family: inherit; padding: 4px 2px; transition: color 0.15s; }
        .nav-btn:hover { color: white; }
        .nav-btn.active { color: white; }
        .mobile-nav-btn { display: block; width: 100%; text-align: left; background: none; border: none; cursor: pointer; color: white; font-weight: 600; font-size: 0.95rem; font-family: inherit; padding: 10px 12px; border-radius: 8px; transition: background 0.15s; }
        .mobile-nav-btn:hover { background: rgba(255,255,255,0.1); }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1152px',
          margin: '0 auto',
          padding: '0 16px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>

          {/* Logo */}
          <div
            onClick={() => navigateTo('home')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <div style={{ padding: '8px', borderRadius: '12px', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white', letterSpacing: '0.03em' }}>Certificate Chain</span>
          </div>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {navLinks.map(([p, label]) => (
              <button
                key={p}
                onClick={() => navigateTo(p)}
                className={`nav-btn${currentPage === p ? ' active' : ''}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right: user info + action button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentUser ? (
              <>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                  Hi, {currentUser.name.length > 18 ? currentUser.name.substring(0, 18) + '…' : currentUser.name}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '12px',
                    background: 'linear-gradient(135deg,#ff6b9d,#c44569)',
                    border: 'none', cursor: 'pointer',
                    color: 'white', fontSize: '0.875rem', fontWeight: 700,
                    fontFamily: 'inherit',
                  }}
                >
                  <LogOut style={{ width: '16px', height: '16px' }} /> Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigateTo('dashboard', 'ADMIN')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 20px', borderRadius: '12px',
                  background: 'linear-gradient(135deg,#ff6b9d,#ff8c42)',
                  border: 'none', cursor: 'pointer',
                  color: 'white', fontSize: '0.875rem', fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              >
                Launch App <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none', // hidden on desktop — overridden via media query in style tag below
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'white', padding: '4px',
              }}
              id="hamburger-btn"
            >
              {isMobileMenuOpen ? <X style={{ width: '22px', height: '22px' }} /> : <Menu style={{ width: '22px', height: '22px' }} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isMobileMenuOpen && (
          <div style={{ padding: '8px 16px 16px', background: 'rgba(0,0,0,0.2)' }}>
            {navLinks.map(([p, label]) => (
              <button key={p} onClick={() => navigateTo(p)} className="mobile-nav-btn">{label}</button>
            ))}
          </div>
        )}
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1 }}>{renderContent()}</main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{
        textAlign: 'center', padding: '20px',
        background: 'rgba(0,0,0,0.15)',
        borderTop: '1px solid rgba(255,255,255,0.15)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500 }}>
          © 2025 Certificate Chain | Admin Access
        </p>
      </footer>
    </div>
  );
}

export default App;
