import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { analyzeResume } from '../utils/api';
import { FileText, UploadCloud, CheckCircle2, AlertTriangle, Target, Search, ChevronRight, Loader2, Sparkles, XCircle, LayoutList, ListChecks, Zap } from 'lucide-react';

const ROLE_GROUPS = [
  { group: 'Software Engineering', roles: ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer', 'Mobile Engineer', 'Game Developer'] },
  { group: 'Infrastructure & DevOps', roles: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Engineer', 'Platform Engineer'] },
  { group: 'Data & AI', roles: ['Data Engineer', 'Data Scientist', 'ML Engineer', 'AI Researcher', 'Data Analyst'] },
  { group: 'Architecture & Leadership', roles: ['System Architect', 'Principal Engineer', 'Staff Engineer', 'Engineering Manager', 'CTO'] },
  { group: 'Security & QA', roles: ['Security Engineer', 'Penetration Tester', 'QA Engineer', 'SDET'] }
];

const LEVELS = [{ value: 'junior', label: 'Junior' }, { value: 'mid', label: 'Mid-Level' }, { value: 'senior', label: 'Senior' }, { value: 'lead', label: 'Lead / Staff' }];

function ScoreGauge({ score, label, color }) {
  const r = 36, circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: 'relative', width: '90px', height: '90px' }}>
        <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={45} cy={45} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={6} />
          <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color, fontFamily: 'Outfit' }}>
          {score}
        </div>
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function SectionBar({ label, score, feedback, issue }) {
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="flex justify-between items-center mb-3">
        <span style={{ fontWeight: 600, fontSize: '0.95rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontWeight: 700, color, fontSize: '0.95rem', fontFamily: 'JetBrains Mono' }}>{score}/100</span>
      </div>
      <div style={{ height: '6px', background: 'var(--bg-base)', borderRadius: '3px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '3px', transition: 'width 1s ease' }} />
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feedback}</p>
      {issue && <div className="flex items-center gap-2 mt-3 text-danger" style={{ fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '4px' }}><AlertTriangle size={14} /> {issue}</div>}
    </div>
  );
}

export default function ResumeAnalyzerPage() {
  const [form, setForm] = useState({ role: 'Software Engineer', level: 'mid' });
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') { setFile(f); setError(''); }
    else setError('Invalid format. Please supply a PDF document.');
  }, []);

  const handleAnalyze = async () => {
    if (!file) { setError('Document payload missing.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      fd.append('targetRole', form.role);
      fd.append('targetLevel', form.level);
      const { data } = await analyzeResume(fd);
      setResult(data);
      setActiveTab('overview');
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis service unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
  const effortColor = { low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' };
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Search },
    { id: 'sections', label: 'Sections', icon: LayoutList },
    { id: 'bullets', label: 'Bullet Rewrite', icon: ListChecks },
    { id: 'action plan', label: 'Action Plan', icon: Zap }
  ];

  return (
    <div className="page" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
      <div className="bg-glow" style={{ top: '10%', right: '5%', width: '400px', height: '400px', background: 'rgba(6, 182, 212, 0.1)' }} />
      <div className="bg-glow" style={{ bottom: '15%', left: '2%', width: '300px', height: '300px', background: 'rgba(139, 92, 246, 0.1)' }} />

      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Header */}
        <div className="mb-10">
          <div className="badge badge-brand mb-4 fade-in">
            <FileText size={14} /> Resume Diagnostics
          </div>
          <h1 className="slide-up" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '12px' }}>
            Optimize your resume for <span className="text-brand-gradient">ATS parsing.</span>
          </h1>
          <p className="slide-up text-secondary" style={{ fontSize: '1.05rem', maxWidth: '600px', animationDelay: '0.1s' }}>
            Our engine scans your document against real-world ATS algorithms to provide actionable refactoring instructions.
          </p>
        </div>

        {/* Upload Form */}
        {!result && (
          <div className="card slide-up" style={{ maxWidth: '640px', margin: '0 auto', animationDelay: '0.2s', padding: '40px' }}>
            <div className="grid-2 mb-6">
              <div className="form-group mb-0">
                <label className="form-label">Target Designation</label>
                <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLE_GROUPS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Seniority</label>
                <select className="form-select" value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <div className={`upload-zone mb-6 ${dragOver ? 'drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}>
              <input type="file" accept=".pdf" onChange={e => { setFile(e.target.files[0]); setError(''); }} />
              <div className="flex flex-col items-center gap-3" style={{ pointerEvents: 'none', maxWidth: '100%' }}>
                {file ? <FileText size={48} className="text-accent-blue" /> : <UploadCloud size={48} className="text-text-tertiary" />}
                {file ? (
                  <>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{file.name}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{(file.size / 1024).toFixed(0)} KB · Ready for scan</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Drop PDF document here</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Maximum file size: 5MB</p>
                  </>
                )}
              </div>
            </div>

            {error && <div className="flex items-center justify-center gap-2 text-danger mb-4 text-sm"><AlertTriangle size={16} /> {error}</div>}

            <button className="btn btn-primary btn-lg w-full" onClick={handleAnalyze} disabled={loading || !file}>
              {loading ? <><Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing Document...</> : <><Search size={18} /> Initiate Scan</>}
            </button>
            <p className="text-center mt-4 text-text-tertiary" style={{ fontSize: '0.75rem' }}>Processing is ephemeral. Documents are not stored.</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="fade-in">
            {/* Top Stats Card */}
            <div className="card card-glow mb-8" style={{ padding: '32px' }}>
              <div className="flex flex-wrap items-center justify-between gap-8">
                <div style={{ flex: '1 1 300px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', marginBottom: '12px', textTransform: 'uppercase' }}>Executive Summary</p>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{result.executiveSummary}</p>
                </div>
                <div className="flex flex-wrap gap-8 justify-center" style={{ flex: '1 1 auto' }}>
                  <ScoreGauge score={result.overallScore ?? 0} label="Overall Match" color="var(--accent-blue)" />
                  <ScoreGauge score={result.atsScore ?? 0} label="ATS Parse Rate" color="var(--accent-cyan)" />
                  <ScoreGauge score={result.roleFitScore ?? 0} label="Role Alignment" color="var(--accent-purple)" />
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6" style={{ background: 'var(--bg-elevated)', padding: '6px', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
              {tabs.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setActiveTab(t.id)} className="flex items-center gap-2"
                    style={{ 
                      padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'var(--transition-fast)',
                      background: activeTab === t.id ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)' 
                    }}>
                    <Icon size={16} /> {t.label}
                  </button>
                );
              })}
            </div>

            {/* Overview Content */}
            {activeTab === 'overview' && (
              <div className="grid-2 slide-up" style={{ gap: '24px' }}>
                {/* Strengths */}
                <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
                  <p className="flex items-center gap-2 text-success mb-4" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}><CheckCircle2 size={16} /> Verified Strengths</p>
                  <div className="flex flex-col gap-3">
                    {(result.strengths || []).map((s, i) => (
                      <div key={i} className="flex gap-3 text-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                        <span className="text-success mt-1">•</span> {s}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Issues */}
                <div className="card" style={{ borderTop: '3px solid var(--danger)' }}>
                  <p className="flex items-center gap-2 text-danger mb-4" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}><XCircle size={16} /> Blocking Issues</p>
                  <div className="flex flex-col gap-3">
                    {(result.criticalIssues || []).map((item, i) => (
                      <div key={i} style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)', borderLeft: `3px solid ${priorityColor[item.priority]}` }}>
                        <div className="flex justify-between items-center mb-2">
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.issue}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: priorityColor[item.priority], textTransform: 'uppercase' }}>{item.priority} PR</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Fix: {item.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyword Analysis */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                  <p className="flex items-center gap-2 text-text-tertiary mb-6" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}><Target size={16} /> Keyword Matrix Analysis</p>
                  <div className="grid-2" style={{ gap: '32px' }}>
                    <div>
                      <p className="text-success mb-3" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Detected Vectors</p>
                      <div className="flex flex-wrap gap-2">
                        {(result.detectedSkills || []).map((s, i) => <span key={i} className="badge badge-outline">{s}</span>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-danger mb-3" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Missing Critical Vectors</p>
                      <div className="flex flex-wrap gap-2">
                        {(result.missingKeywords || []).map((k, i) => (
                          <span key={i} className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sections Content */}
            {activeTab === 'sections' && (
              <div className="grid-2 slide-up" style={{ gap: '24px' }}>
                {Object.entries(result.sectionScores || {}).map(([key, val]) => {
                  const color = val.score >= 75 ? 'var(--success)' : val.score >= 50 ? 'var(--warning)' : 'var(--danger)';
                  return (
                    <div key={key} className="card flex flex-col" style={{ padding: '24px', borderTop: `3px solid ${color}` }}>
                      <div className="flex justify-between items-center mb-4">
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{key}</span>
                        <span style={{ fontWeight: 800, color, fontSize: '1.25rem', fontFamily: 'Outfit' }}>{val.score}<span style={{fontSize: '0.8rem', color: 'var(--text-tertiary)'}}>/100</span></span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px', flex: 1 }}>{val.feedback}</p>
                      {val.issue && (
                        <div className="flex items-start gap-2 text-danger mt-auto" style={{ fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.08)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{val.issue}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bullets Content */}
            {activeTab === 'bullets' && (
              <div className="card slide-up">
                <p className="text-text-tertiary mb-6" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Optimization Suggestions</p>
                <div className="flex flex-col gap-6">
                  {(result.bulletImprovements || []).map((item, i) => (
                    <div key={i} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <p className="text-danger mb-2" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Suboptimal Pattern</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.original}</p>
                      </div>
                      <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
                        <p className="text-success mb-2 flex items-center gap-1" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}><Sparkles size={12} /> Refactored Pattern</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.improved}</p>
                      </div>
                      <div style={{ padding: '12px 16px', background: 'var(--bg-base)' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Rationle: {item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan Content */}
            {activeTab === 'action plan' && (
              <div className="card slide-up">
                <p className="text-text-tertiary mb-6" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Execution Steps</p>
                <div className="grid-3">
                  {(result.actionPlan || []).map((item, i) => (
                    <div key={i} className="flex flex-col gap-4" style={{ padding: '24px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <div className="flex justify-between items-center">
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-blue)', color: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>{i + 1}</div>
                        <span className="badge" style={{ background: `${effortColor[item.effort]}15`, color: effortColor[item.effort], border: `1px solid ${effortColor[item.effort]}30` }}>{item.effort} effort</span>
                      </div>
                      <div className="flex flex-col flex-1">
                        <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-primary)' }}>{item.action}</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Global Actions */}
            <div className="flex gap-4 mt-8" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => { setResult(null); setFile(null); }}>New Scan</button>
              <Link to="/onboarding" className="btn btn-brand">Initialize Interview Session <ChevronRight size={18} /></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
