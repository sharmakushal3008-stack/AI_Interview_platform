import { useState } from 'react';
import { Download, Plus, Trash2, LayoutTemplate, Wand2, Loader2, X } from 'lucide-react';
import { buildResume } from '../utils/api';

export default function ResumeBuilderPage() {
  const [resume, setResume] = useState({
    personal: { name: 'Kushal Sharma', email: 'kushal@example.com', phone: '+1 234 567 8900', location: 'San Francisco, CA', linkedin: 'linkedin.com/in/kushal', github: 'github.com/kushal' },
    summary: 'Detail-oriented Software Engineer with experience in building scalable web applications. Proficient in modern JavaScript frameworks and passionate about optimizing backend performance.',
    experience: [
      { id: Date.now(), company: 'TechNova', role: 'Full Stack Engineer', date: 'Jan 2022 - Present', bullets: '• Architected a microservices backend serving 500K+ daily requests.\n• Reduced page load times by 40% through aggressive caching and code splitting.\n• Mentored 3 junior developers.' }
    ],
    education: [
      { id: Date.now() + 1, school: 'State University', degree: 'B.S. in Computer Science', date: '2018 - 2022', gpa: '3.8' }
    ],
    skills: 'JavaScript (ES6+), React.js, Node.js, Express, MongoDB, PostgreSQL, Docker, AWS',
    projects: [
      { id: Date.now() + 2, name: 'AuraAI', desc: '• Built a real-time AI career intelligence platform using React and Gemini 2.0.\n• Implemented secure, JWT-based authentication and MongoDB persistence.' }
    ]
  });

  const [activeTab, setActiveTab] = useState('personal');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const { data } = await buildResume(aiPrompt);
      const formatted = {
        ...data,
        experience: (data.experience || []).map((x, i) => ({ ...x, id: Date.now() + i })),
        education: (data.education || []).map((x, i) => ({ ...x, id: Date.now() + 100 + i })),
        projects: (data.projects || []).map((x, i) => ({ ...x, id: Date.now() + 200 + i })),
      };
      setResume(formatted);
      setShowAiModal(false);
      setAiPrompt('');
    } catch (err) {
      alert('Failed to generate resume: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePersonal = (k, v) => setResume(p => ({ ...p, personal: { ...p.personal, [k]: v } }));
  const updateArr = (key, idx, k, v) => setResume(p => {
    const arr = [...p[key]];
    arr[idx] = { ...arr[idx], [k]: v };
    return { ...p, [key]: arr };
  });
  const addArr = (key, defaultObj) => setResume(p => ({ ...p, [key]: [...p[key], { id: Date.now(), ...defaultObj }] }));
  const removeArr = (key, id) => setResume(p => ({ ...p, [key]: p[key].filter(x => x.id !== id) }));

  const handlePrint = () => {
    window.print();
  };

  const tabs = ['personal', 'summary', 'experience', 'education', 'skills', 'projects'];

  return (
    <div className="page" style={{ paddingTop: '80px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Builder Header */}
      <div style={{ padding: '0 32px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-3">
          <LayoutTemplate className="text-accent-blue" />
          <h1 style={{ fontSize: '1.2rem', margin: 0 }}>Resume Studio</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn btn-brand" onClick={() => setShowAiModal(true)}>
            <Wand2 size={16} /> Generate with AI
          </button>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card slide-up" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="flex items-center gap-2" style={{ fontSize: '1.2rem', margin: 0 }}><Wand2 className="text-accent-blue" /> Auto-Generate Resume</h3>
              <button onClick={() => !isGenerating && setShowAiModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Describe your target role, years of experience, and key achievements. AI will draft a complete ATS-optimized resume for you.</p>
            <textarea className="form-textarea mb-6" rows={5} placeholder="e.g. I am a mid-level React engineer with 4 years of experience. I built an e-commerce platform that increased sales by 20%..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} disabled={isGenerating} />
            <button className="btn btn-brand w-full" onClick={handleAiGenerate} disabled={isGenerating || !aiPrompt.trim()}>
              {isGenerating ? <><Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Generating Draft...</> : 'Generate Resume'}
            </button>
          </div>
        </div>
      )}

      <div className="flex" style={{ flex: 1, overflow: 'hidden' }}>
        
        {/* Editor Sidebar */}
        <div style={{ width: '450px', background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
          
          {/* Tab Selection */}
          <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)', overflowX: 'auto', padding: '12px 16px', gap: '8px' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ padding: '6px 12px', borderRadius: 'var(--radius-full)', background: activeTab === t ? 'var(--text-primary)' : 'transparent', color: activeTab === t ? 'var(--bg-base)' : 'var(--text-secondary)', border: '1px solid', borderColor: activeTab === t ? 'var(--text-primary)' : 'var(--border-strong)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                {t}
              </button>
            ))}
          </div>

          {/* Form Editor */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {activeTab === 'personal' && (
              <div className="flex flex-col gap-4">
                <div><label className="form-label">Full Name</label><input className="form-input" value={resume.personal.name} onChange={e => updatePersonal('name', e.target.value)} /></div>
                <div><label className="form-label">Email</label><input className="form-input" value={resume.personal.email} onChange={e => updatePersonal('email', e.target.value)} /></div>
                <div><label className="form-label">Phone</label><input className="form-input" value={resume.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} /></div>
                <div><label className="form-label">Location</label><input className="form-input" value={resume.personal.location} onChange={e => updatePersonal('location', e.target.value)} /></div>
                <div><label className="form-label">LinkedIn (Optional)</label><input className="form-input" value={resume.personal.linkedin} onChange={e => updatePersonal('linkedin', e.target.value)} /></div>
                <div><label className="form-label">GitHub (Optional)</label><input className="form-input" value={resume.personal.github} onChange={e => updatePersonal('github', e.target.value)} /></div>
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="form-label">Professional Summary</label>
                  <textarea className="form-textarea" rows={6} value={resume.summary} onChange={e => setResume({ ...resume, summary: e.target.value })} />
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="flex flex-col gap-6">
                {resume.experience.map((exp, i) => (
                  <div key={exp.id} className="card" style={{ padding: '16px' }}>
                    <div className="flex justify-between mb-4"><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Role {i + 1}</span><button onClick={() => removeArr('experience', exp.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button></div>
                    <div className="flex flex-col gap-3">
                      <input className="form-input" placeholder="Company" value={exp.company} onChange={e => updateArr('experience', i, 'company', e.target.value)} />
                      <input className="form-input" placeholder="Job Title" value={exp.role} onChange={e => updateArr('experience', i, 'role', e.target.value)} />
                      <input className="form-input" placeholder="Dates (e.g. Jan 2020 - Present)" value={exp.date} onChange={e => updateArr('experience', i, 'date', e.target.value)} />
                      <textarea className="form-textarea" placeholder="Bullet points..." value={exp.bullets} onChange={e => updateArr('experience', i, 'bullets', e.target.value)} rows={4} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-secondary" onClick={() => addArr('experience', { company: '', role: '', date: '', bullets: '' })}><Plus size={16}/> Add Experience</button>
              </div>
            )}

            {activeTab === 'education' && (
              <div className="flex flex-col gap-6">
                {resume.education.map((ed, i) => (
                  <div key={ed.id} className="card" style={{ padding: '16px' }}>
                    <div className="flex justify-between mb-4"><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Education {i + 1}</span><button onClick={() => removeArr('education', ed.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button></div>
                    <div className="flex flex-col gap-3">
                      <input className="form-input" placeholder="School / University" value={ed.school} onChange={e => updateArr('education', i, 'school', e.target.value)} />
                      <input className="form-input" placeholder="Degree" value={ed.degree} onChange={e => updateArr('education', i, 'degree', e.target.value)} />
                      <input className="form-input" placeholder="Dates" value={ed.date} onChange={e => updateArr('education', i, 'date', e.target.value)} />
                      <input className="form-input" placeholder="GPA (Optional)" value={ed.gpa} onChange={e => updateArr('education', i, 'gpa', e.target.value)} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-secondary" onClick={() => addArr('education', { school: '', degree: '', date: '', gpa: '' })}><Plus size={16}/> Add Education</button>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="form-label">Skills (Comma separated)</label>
                  <textarea className="form-textarea" rows={4} value={resume.skills} onChange={e => setResume({ ...resume, skills: e.target.value })} />
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="flex flex-col gap-6">
                {resume.projects.map((proj, i) => (
                  <div key={proj.id} className="card" style={{ padding: '16px' }}>
                    <div className="flex justify-between mb-4"><span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Project {i + 1}</span><button onClick={() => removeArr('projects', proj.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button></div>
                    <div className="flex flex-col gap-3">
                      <input className="form-input" placeholder="Project Name" value={proj.name} onChange={e => updateArr('projects', i, 'name', e.target.value)} />
                      <textarea className="form-textarea" placeholder="Description bullets..." value={proj.desc} onChange={e => updateArr('projects', i, 'desc', e.target.value)} rows={3} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-secondary" onClick={() => addArr('projects', { name: '', desc: '' })}><Plus size={16}/> Add Project</button>
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Container */}
        <div style={{ flex: 1, background: '#e4e4e7', overflowY: 'auto', padding: '40px', display: 'flex', justifyContent: 'center' }}>
          
          {/* A4 Paper */}
          <div id="resume-preview" style={{ width: '800px', minHeight: '1130px', background: '#fff', color: '#000', padding: '60px', boxShadow: 'var(--shadow-lg)', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '16px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0', color: '#000', fontFamily: 'inherit', letterSpacing: '0' }}>{resume.personal.name || 'Your Name'}</h1>
              <div style={{ fontSize: '13px', color: '#444', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {resume.personal.email && <span>{resume.personal.email}</span>}
                {resume.personal.phone && <span>{resume.personal.phone}</span>}
                {resume.personal.location && <span>{resume.personal.location}</span>}
                {resume.personal.linkedin && <span>{resume.personal.linkedin}</span>}
                {resume.personal.github && <span>{resume.personal.github}</span>}
              </div>
            </div>

            {/* Summary */}
            {resume.summary && (
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #000', paddingBottom: '4px', margin: '0 0 8px 0' }}>Summary</h2>
                <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0, color: '#333' }}>{resume.summary}</p>
              </div>
            )}

            {/* Experience */}
            {resume.experience.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #000', paddingBottom: '4px', margin: '0 0 12px 0' }}>Experience</h2>
                {resume.experience.map(exp => (
                  <div key={exp.id} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13.5px', color: '#000' }}>{exp.role}</strong>
                      <span style={{ fontSize: '13px', color: '#555' }}>{exp.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#444', fontWeight: 600, marginBottom: '6px' }}>{exp.company}</div>
                    <div style={{ fontSize: '13px', color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{exp.bullets}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Education */}
            {resume.education.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #000', paddingBottom: '4px', margin: '0 0 12px 0' }}>Education</h2>
                {resume.education.map(ed => (
                  <div key={ed.id} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '13.5px', color: '#000' }}>{ed.school}</strong>
                      <span style={{ fontSize: '13px', color: '#555' }}>{ed.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#333', marginTop: '2px' }}>
                      {ed.degree} {ed.gpa && <span style={{ color: '#555' }}>| GPA: {ed.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            {resume.skills && (
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #000', paddingBottom: '4px', margin: '0 0 8px 0' }}>Skills</h2>
                <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0, color: '#333' }}>{resume.skills}</p>
              </div>
            )}

            {/* Projects */}
            {resume.projects.length > 0 && (
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: '#000', borderBottom: '1px solid #000', paddingBottom: '4px', margin: '0 0 12px 0' }}>Projects</h2>
                {resume.projects.map(proj => (
                  <div key={proj.id} style={{ marginBottom: '12px' }}>
                    <strong style={{ fontSize: '13.5px', color: '#000', display: 'block', marginBottom: '4px' }}>{proj.name}</strong>
                    <div style={{ fontSize: '13px', color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{proj.desc}</div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
