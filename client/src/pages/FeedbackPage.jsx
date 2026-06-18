import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Award, Target, AlertTriangle, CheckCircle2, ChevronRight, BarChart3, LayoutDashboard, Flag, Layers } from 'lucide-react';

export default function FeedbackPage() {
  const navigate = useNavigate();
  const { feedbackReport, session, reset } = useInterview();

  if (!feedbackReport) {
    return (
      <div className="page flex flex-col items-center justify-center gap-4" style={{ minHeight: '60vh' }}>
        <AlertTriangle size={48} className="text-text-tertiary" />
        <p className="text-secondary">Telemetry report not found or expired.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  const { overallScore, band, skillRadar, executiveSummary, topStrengths, criticalGaps, studyPlan, hiringRecommendation, questionBreakdown } = feedbackReport;

  const radarData = skillRadar ? [
    { subject: 'Problem Solving', A: skillRadar.problemSolving },
    { subject: 'Communication', A: skillRadar.communication },
    { subject: 'Tech Depth', A: skillRadar.technicalDepth },
    { subject: 'Code Quality', A: skillRadar.codeQuality },
    { subject: 'Sys Thinking', A: skillRadar.systemThinking },
    { subject: 'Behavior Fit', A: skillRadar.behavioralFit },
  ] : [];

  const getBandColor = (b) => {
    if(b === 'Excellent') return 'var(--success)';
    if(b === 'Good') return 'var(--accent-cyan)';
    if(b === 'Average') return 'var(--warning)';
    return 'var(--danger)';
  };

  const getHireColor = (h) => {
    if(h?.includes('Strong Hire')) return 'var(--success)';
    if(h?.includes('Hire')) return 'var(--accent-cyan)';
    return 'var(--danger)';
  };

  const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };

  return (
    <div className="page" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="badge badge-brand mb-4 fade-in">
            <Target size={14} /> Evaluation Complete
          </div>
          <h1 className="slide-up" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '12px' }}>
            Diagnostic <span className="text-brand-gradient">Report</span>
          </h1>
          <p className="text-secondary slide-up" style={{ fontSize: '1.05rem', animationDelay: '0.1s' }}>
            {session?.role} • {session?.level} • {session?.roundType}
          </p>
        </div>

        {/* Top Analytics */}
        <div className="grid-2 mb-8 slide-up" style={{ alignItems: 'stretch', animationDelay: '0.2s' }}>
          
          {/* Main Score Card */}
          <div className="card flex flex-col items-center justify-center text-center" style={{ padding: '48px 32px' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '24px' }}>
              <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={80} cy={80} r={70} fill="none" stroke="var(--border-strong)" strokeWidth={8} />
                <circle cx={80} cy={80} r={70} fill="none" stroke={getBandColor(band)} strokeWidth={8}
                  strokeDasharray={`${2 * Math.PI * 70 * overallScore / 100} ${2 * Math.PI * 70}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dasharray 1.5s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', items: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: getBandColor(band), fontFamily: 'Outfit', lineHeight: 1 }}>{overallScore}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>/ 100</span>
              </div>
            </div>
            
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getBandColor(band), marginBottom: '12px', fontFamily: 'Outfit' }}>{band}</div>
            
            <div className="badge" style={{ background: `${getHireColor(hiringRecommendation)}15`, color: getHireColor(hiringRecommendation), border: `1px solid ${getHireColor(hiringRecommendation)}30`, padding: '8px 16px', fontSize: '0.9rem' }}>
              {hiringRecommendation}
            </div>
          </div>

          {/* Radar Chart */}
          <div className="card" style={{ padding: '32px' }}>
            <p className="flex items-center gap-2 text-text-tertiary mb-4" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}><BarChart3 size={16} /> Skill Matrix</p>
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="var(--border-strong)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <Radar name="Score" dataKey="A" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.25} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }} itemStyle={{ color: 'var(--accent-blue)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="card mb-8 slide-up" style={{ animationDelay: '0.3s', borderLeft: '3px solid var(--accent-purple)' }}>
          <p className="text-accent-purple mb-3" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Executive Summary</p>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.8, fontSize: '1rem' }}>{executiveSummary}</p>
        </div>

        {/* Strengths & Gaps */}
        <div className="grid-2 mb-8 slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="card" style={{ borderTop: '3px solid var(--success)' }}>
            <p className="flex items-center gap-2 text-success mb-4" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}><CheckCircle2 size={16} /> Verified Strengths</p>
            <div className="flex flex-col gap-3">
              {(topStrengths || []).map((s, i) => (
                <div key={i} className="flex gap-3 text-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <span className="text-success mt-1">•</span> {s}
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--danger)' }}>
            <p className="flex items-center gap-2 text-danger mb-4" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}><AlertTriangle size={16} /> Critical Gaps</p>
            <div className="flex flex-col gap-3">
              {(criticalGaps || []).map((g, i) => (
                <div key={i} className="flex gap-3 text-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <span className="text-danger mt-1">•</span> {g}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Study Plan */}
        {studyPlan?.length > 0 && (
          <div className="card mb-8 slide-up" style={{ animationDelay: '0.5s' }}>
            <p className="flex items-center gap-2 text-text-tertiary mb-6" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}><Flag size={16} /> Remediation Protocol</p>
            <div className="flex flex-col gap-4">
              {studyPlan.map((item, i) => (
                <div key={i} className="flex items-start gap-4" style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <div className="badge" style={{ background: `${priorityColor[item.priority]}15`, color: priorityColor[item.priority], border: `1px solid ${priorityColor[item.priority]}30`, fontSize: '0.7rem', flexShrink: 0, padding: '4px 8px' }}>
                    {item.priority} PR
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px', color: 'var(--text-primary)' }}>{item.topic}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {(item.resources || []).map((r, j) => <span key={j} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>• {r}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Breakdown */}
        {questionBreakdown?.length > 0 && (
          <div className="card mb-10 slide-up" style={{ animationDelay: '0.6s' }}>
            <p className="flex items-center gap-2 text-text-tertiary mb-6" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}><Award size={16} /> Granular Telemetry</p>
            
            {(() => {
              // Internal helper to render inline corrections highlight in the feedback summary
              const renderAnswerWithHighlights = (ans, corrections) => {
                if (!ans) return '';
                if (!corrections || corrections.length === 0) return ans;
                const sorted = [...corrections].sort((a, b) => b.originalText.length - a.originalText.length);
                let highlighted = ans;
                const map = {};
                sorted.forEach((corr, idx) => {
                  if (!corr.originalText) return;
                  const escaped = corr.originalText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                  const regex = new RegExp(`(${escaped})`, 'gi');
                  if (regex.test(highlighted)) {
                    const placeholder = `__CORR_MARKER_${idx}__`;
                    map[placeholder] = corr;
                    highlighted = highlighted.replace(regex, placeholder);
                  }
                });
                const parts = highlighted.split(/(__CORR_MARKER_\d+__)/g);
                return parts.map((part, index) => {
                  if (part.startsWith('__CORR_MARKER_') && part.endsWith('__')) {
                    const corr = map[part];
                    if (corr) {
                      return (
                        <span
                          key={index}
                          style={{
                            borderBottom: '2px dashed var(--danger)',
                            background: 'rgba(239, 68, 68, 0.06)',
                            cursor: 'help',
                            padding: '0 2px'
                          }}
                          title={`Critique: ${corr.explanation} (Suggested: "${corr.correction}")`}>
                          {corr.originalText}
                        </span>
                      );
                    }
                  }
                  return part;
                });
              };

              return (
                <div className="flex flex-col gap-3">
                  {questionBreakdown.map((q, i) => (
                    <details key={i} style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', cursor: 'pointer' }}>
                      <summary className="flex items-center gap-3" style={{ padding: '16px', listStyle: 'none', userSelect: 'none' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: q.score >= 70 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: q.score >= 70 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>
                          {q.score}
                        </div>
                        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{q.question}</span>
                        <span className="badge badge-outline" style={{ flexShrink: 0 }}>{q.type}</span>
                      </summary>
                      
                      <div style={{ padding: '0 16px 16px 60px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, textAlign: 'left' }}>{q.feedback}</p>
                        
                        {/* Submitted Answer with Highlighted Mistakes */}
                        {q.answer && (
                          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '12px 16px', textAlign: 'left' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.05em' }}>Your Submitted Answer (Hover underlines for corrections)</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                              {renderAnswerWithHighlights(q.answer, q.inlineCorrections)}
                            </p>
                          </div>
                        )}

                        {/* List of Corrections */}
                        {q.inlineCorrections && q.inlineCorrections.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, margin: 0, letterSpacing: '0.05em' }}>Critique Details ({q.inlineCorrections.length})</p>
                            {q.inlineCorrections.map((corr, idx) => (
                              <div key={idx} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '10px 14px', fontSize: '0.85rem' }}>
                                <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: '4px' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--danger)', textDecoration: 'line-through' }}>"{corr.originalText}"</span>
                                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>➔ "{corr.correction}"</span>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{corr.explanation}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Polished Refactored Answer */}
                        {q.refactoredAnswer && (
                          <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '4px', padding: '12px 16px', textAlign: 'left' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--success)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.05em' }}>Refactored Polish (Perfect Phrasing)</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                              "{q.refactoredAnswer}"
                            </p>
                          </div>
                        )}

                        {/* Suggested model key points */}
                        {q.suggestedAnswer && (
                          <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: '4px', borderLeft: '2px solid var(--accent-blue)', textAlign: 'left' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '4px', fontWeight: 600 }}>OPTIMAL MODEL ANSWER (KEY POINTS)</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{q.suggestedAnswer}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={18} /> View Dashboard
          </button>
          <button className="btn btn-brand btn-lg" onClick={() => { reset(); navigate('/onboarding'); }}>
            Initialize New Session <ChevronRight size={18} />
          </button>
        </div>
        
      </div>
    </div>
  );
}
