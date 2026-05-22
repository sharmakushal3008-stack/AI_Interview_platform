import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHistory } from '../utils/api';
import { ClipboardList, TrendingUp, Award, Target, Plus, Loader2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getHistory()
      .then(r => setSessions(r.data))
      .catch(() => setError('Could not load history. Is the server running?'))
      .finally(() => setLoading(false));
  }, []);

  const avg = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.overallScore || 0), 0) / sessions.length) : 0;
  const best = sessions.length ? Math.max(...sessions.map(s => s.overallScore || 0)) : 0;
  
  const getBandColor = (b) => {
    if(b === 'Excellent') return 'var(--success)';
    if(b === 'Good') return 'var(--accent-cyan)';
    if(b === 'Average') return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="page" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '4px' }}>Dashboard</h1>
            <p className="text-secondary">Your historical performance and session metrics.</p>
          </div>
          <Link to="/onboarding" className="btn btn-brand">
            <Plus size={16} /> New Session
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid-3 mb-8">
          {[
            { label: 'Total Sessions', value: sessions.length, icon: ClipboardList, color: 'var(--accent-blue)' },
            { label: 'Average Score', value: sessions.length ? `${avg}/100` : '—', icon: TrendingUp, color: 'var(--accent-purple)' },
            { label: 'Peak Performance', value: sessions.length ? `${best}/100` : '—', icon: Award, color: 'var(--warning)' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card slide-up" style={{ animationDelay: `${i * 0.1}s`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit' }}>{stat.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* States */}
        {loading && (
          <div className="flex items-center justify-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 size={32} className="spin text-text-tertiary" style={{ animation: 'spin 1s linear infinite' }} />
            <p className="text-secondary">Retrieving metrics...</p>
          </div>
        )}
        
        {error && (
          <div className="card border-danger bg-danger-glow flex items-center gap-2 text-danger justify-center">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="card text-center slide-up" style={{ padding: '64px 24px', animationDelay: '0.3s' }}>
            <div className="flex justify-center mb-4 text-text-tertiary">
              <Target size={48} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Data Available</h3>
            <p className="text-secondary mb-6" style={{ maxWidth: '400px', margin: '0 auto 24px auto' }}>
              Complete your first mock interview to generate performance metrics and history.
            </p>
            <Link to="/onboarding" className="btn btn-primary">Initialize First Session</Link>
          </div>
        )}

        {/* History List */}
        {!loading && sessions.length > 0 && (
          <div className="flex" style={{ flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontFamily: 'Inter', fontWeight: 600 }}>Session History</h2>
            {sessions.map((s, idx) => (
              <div key={s.sessionId} className="card slide-up" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '24px', animationDelay: `${0.1 * idx}s` }}>
                
                <div style={{
                  width: '60px', height: '60px', borderRadius: 'var(--radius-full)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${getBandColor(s.band)}`,
                  background: `${getBandColor(s.band)}15`,
                }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: getBandColor(s.band) }}>{s.overallScore || '?'}</span>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-2" style={{ flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{s.role}</span>
                    <span className="badge badge-outline">{s.roundType}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                    {s.level} · {new Date(s.completedAt || s.startedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: getBandColor(s.band), fontSize: '1.1rem' }}>{s.band}</div>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
