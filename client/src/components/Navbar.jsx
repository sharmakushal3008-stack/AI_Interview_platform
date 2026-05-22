import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { Mic, Menu, X, LayoutDashboard, FileText, LayoutTemplate } from 'lucide-react';

const NAV_LINKS = [
  { to: '/resume', label: 'Resume Analyzer', icon: FileText },
  { to: '/builder', label: 'Resume Builder', icon: LayoutTemplate },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function Navbar() {
  const location = useLocation();
  const { reset } = useInterview();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="navbar" style={{
        background: isScrolled ? 'rgba(5, 5, 5, 0.8)' : 'transparent',
        borderBottomColor: isScrolled ? 'var(--border-subtle)' : 'transparent'
      }}>
        <Link to="/" className="navbar-brand" onClick={() => { reset(); closeMenu(); }}>
          <div className="brand-icon">
            <Mic size={18} strokeWidth={2.5} />
          </div>
          AuraAI
        </Link>

        {/* Desktop Nav */}
        <div className="nav-links">
          {NAV_LINKS.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
          <div style={{ width: '1px', height: '24px', background: 'var(--border-strong)', margin: '0 8px' }} />
          <Link to="/onboarding" className="btn btn-primary btn-sm" onClick={reset}>
            New Interview
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: '72px', left: 0, right: 0,
          background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)',
          padding: '16px', zIndex: 999, display: 'flex', flexDirection: 'column', gap: '8px'
        }} className="slide-up">
          {NAV_LINKS.map(link => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link 
                key={link.to} 
                to={link.to} 
                className="flex items-center gap-2"
                style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--border-subtle)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textDecoration: 'none', fontWeight: 500
                }}
                onClick={closeMenu}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />
          <Link to="/onboarding" className="btn btn-primary" onClick={() => { reset(); closeMenu(); }}>
            New Interview
          </Link>
        </div>
      )}
    </>
  );
}
