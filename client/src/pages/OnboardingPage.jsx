import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { startSession } from '../utils/api';
import { UploadCloud, Code2, Server, Database, UserCheck, Shield, Layers, Layout, FileText, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const ROLE_GROUPS = [
  { group: 'Software Engineering', icon: Code2, roles: ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Full Stack Engineer'] },
  { group: 'Infrastructure & DevOps', icon: Server, roles: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Architect'] },
  { group: 'Data & AI', icon: Database, roles: ['Data Scientist', 'ML Engineer', 'Data Engineer'] },
  { group: 'Leadership', icon: UserCheck, roles: ['Engineering Manager', 'Staff Engineer', 'CTO'] },
  { group: 'Security', icon: Shield, roles: ['Security Engineer', 'Penetration Tester'] },
];

const LEVELS = [
  { value: 'junior', label: 'Junior', desc: '0-2 years' },
  { value: 'mid', label: 'Mid-Level', desc: '2-5 years' },
  { value: 'senior', label: 'Senior', desc: '5-10 years' },
  { value: 'lead', label: 'Lead/Staff', desc: '10+ years' }
];

const ROUND_TYPES = [
  { value: 'behavioral', label: 'Behavioral', icon: UserCheck, desc: 'Leadership principles & past experience' },
  { value: 'technical', label: 'Technical Depth', icon: Layers, desc: 'Language internals & framework mechanics' },
  { value: 'coding', label: 'Algorithms', icon: Code2, desc: 'Data structures & problem solving' },
  { value: 'system_design', label: 'System Design', icon: Layout, desc: 'Scalability & distributed systems' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { startInterview } = useInterview();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ role: '', level: 'mid', roundType: 'technical' });
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') setResumeFile(file);
    else setError('Invalid format. Please upload a PDF file.');
  }, []);

  const handleStart = async () => {
    if (!form.role) { setError('Role is required.'); return; }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('role', form.role);
      fd.append('level', form.level);
      fd.append('roundType', form.roundType);
      if (resumeFile) fd.append('resume', resumeFile);

      const { data } = await startSession(fd);
      startInterview(data);
      navigate('/interview');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initialize session. Verify backend connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingTop: '100px' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Configure Interview Parameters</h1>
          <p className="text-secondary">Calibrate the engine to match your target role and proficiency.</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8" style={{ padding: '0 40px' }}>
          {[1, 2, 3].map((s, idx) => (
            <div key={s} className="flex items-center" style={{ flex: idx < 2 ? 1 : 0 }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > s ? 'var(--accent-blue)' : step === s ? 'var(--bg-elevated)' : 'var(--bg-base)',
                border: `2px solid ${step >= s ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
                color: step > s ? '#fff' : step === s ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                fontWeight: 'bold', transition: 'all 0.3s'
              }}>
                {step > s ? <CheckCircle2 size={18} /> : s}
              </div>
              {idx < 2 && (
                <div style={{ flex: 1, height: '2px', background: step > s ? 'var(--accent-blue)' : 'var(--border-strong)', margin: '0 12px', transition: 'all 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <div className="card shadow-lg slide-up">
          {/* Step 1 */}
          {step === 1 && (
            <div className="fade-in flex" style={{ flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Target Designation</h2>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="">Select a role...</option>
                    {ROLE_GROUPS.map(g => (
                      <optgroup key={g.group} label={g.group}>
                        {g.roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Proficiency Level</h2>
                <div className="grid-2">
                  {LEVELS.map(l => (
                    <button key={l.value} className="btn"
                      style={{
                        padding: '16px', flexDirection: 'column', alignItems: 'flex-start',
                        background: form.level === l.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-base)',
                        border: `1px solid ${form.level === l.value ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
                        color: form.level === l.value ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onClick={() => setForm(p => ({ ...p, level: l.value }))}>
                      <span style={{ fontWeight: 600 }}>{l.label}</span>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="flex items-center gap-2 text-danger mt-4"><AlertCircle size={16} /> <span style={{ fontSize: '0.85rem' }}>{error}</span></div>}
              
              <button className="btn btn-primary w-full mt-4" onClick={() => { if (!form.role) { setError('Role is required'); return; } setError(''); setStep(2); }}>
                Proceed <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="fade-in flex" style={{ flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Evaluation Module</h2>
              <div className="flex" style={{ flexDirection: 'column', gap: '12px' }}>
                {ROUND_TYPES.map(rt => {
                  const Icon = rt.icon;
                  return (
                    <button key={rt.value} 
                      className="flex items-center gap-4 w-full"
                      style={{
                        padding: '16px 20px', borderRadius: 'var(--radius-md)',
                        background: form.roundType === rt.value ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-base)',
                        border: `1px solid ${form.roundType === rt.value ? 'var(--accent-blue)' : 'var(--border-strong)'}`,
                        textAlign: 'left', cursor: 'pointer', transition: 'var(--transition-fast)'
                      }}
                      onClick={() => setForm(p => ({ ...p, roundType: rt.value }))}>
                      <div style={{ color: form.roundType === rt.value ? 'var(--accent-blue)' : 'var(--text-tertiary)' }}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rt.label}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rt.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-4">
                <button className="btn btn-secondary w-full" onClick={() => setStep(1)}><ArrowLeft size={16} /> Back</button>
                <button className="btn btn-primary w-full" onClick={() => setStep(3)}>Proceed <ArrowRight size={16} /></button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="fade-in flex" style={{ flexDirection: 'column', gap: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Context Injection (Optional)</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>Provide your resume to ground the AI's questions in your actual work history.</p>
                
                <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}>
                  <input type="file" accept=".pdf" onChange={e => setResumeFile(e.target.files[0])} />
                  <div className="flex items-center justify-center" style={{ flexDirection: 'column', gap: '12px', pointerEvents: 'none' }}>
                    {resumeFile ? <FileText size={48} color="var(--accent-blue)" /> : <UploadCloud size={48} color="var(--text-tertiary)" />}
                    {resumeFile ? (
                      <>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{resumeFile.name}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{(resumeFile.size / 1024).toFixed(0)} KB</p>
                      </>
                    ) : (
                      <>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Drag and drop PDF here</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Maximum 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Summary</p>
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  <span className="badge badge-brand">{form.role}</span>
                  <span className="badge badge-outline">{form.level}</span>
                  <span className="badge badge-purple">{form.roundType}</span>
                </div>
              </div>

              {error && <div className="flex items-center gap-2 text-danger"><AlertCircle size={16} /> <span style={{ fontSize: '0.85rem' }}>{error}</span></div>}

              <div className="flex gap-4 mt-4">
                <button className="btn btn-secondary w-full" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
                <button className="btn btn-brand w-full" onClick={handleStart} disabled={loading}>
                  {loading ? <><Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Initializing...</> : 'Launch Environment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
