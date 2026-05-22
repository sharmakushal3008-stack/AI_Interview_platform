import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { useSpeechToText, useTimer } from '../hooks/useInterview';
import { submitAnswer, getHint, completeSession } from '../utils/api';
import { Mic, Square, Lightbulb, SkipForward, Send, Menu, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function InterviewPage() {
  const navigate = useNavigate();
  const { session, currentQuestionIndex, recordAnswer, nextQuestion, finishInterview } = useInterview();
  const [answer, setAnswer]         = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [hint, setHint]             = useState(null);
  const [hintsLeft, setHintsLeft]   = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [qPhase, setQPhase]         = useState('answering'); // answering | evaluated
  const [error, setError]           = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const textAreaRef = useRef(null);

  const questions  = session?.questions || [];
  const currentQ   = questions[currentQuestionIndex];
  const isLast     = currentQuestionIndex >= questions.length - 1;
  const progress   = questions.length > 0
    ? ((currentQuestionIndex + (qPhase === 'evaluated' ? 1 : 0)) / questions.length) * 100
    : 0;

  const { isListening, isSupported, startListening, stopListening, resetTranscript } = useSpeechToText({
    onResult: (text) => setAnswer(prev => prev ? prev + ' ' + text : text),
  });

  const timer = useTimer(180);

  useEffect(() => {
    if (!currentQ) return;
    setAnswer(''); setEvaluation(null); setHint(null); setHintsLeft(3);
    setQPhase('answering'); setError('');
    resetTranscript();
    timer.reset(180);
    timer.start();
  }, [currentQuestionIndex, currentQ?._id]);

  useEffect(() => {
    if (timer.isExpired && qPhase === 'answering') handleSubmit(true);
  }, [timer.isExpired]);

  const handleMicToggle = () => isListening ? stopListening() : startListening();

  const handleSubmit = useCallback(async (timedOut = false) => {
    if (submitting) return;
    setSubmitting(true);
    timer.pause();
    if (isListening) stopListening();
    setError('');
    try {
      const { data } = await submitAnswer({
        sessionId: session.sessionId,
        questionId: currentQ._id,
        answer: timedOut ? answer + ' [Time expired]' : answer,
        timeSpent: timer.elapsed,
      });
      recordAnswer(currentQ._id, { answer, evaluation: data.evaluation, timeSpent: timer.elapsed });
      setEvaluation(data.evaluation);
      setQPhase('evaluated');
    } catch (err) {
      setError(err.response?.data?.error || 'Evaluation failed. Verify network connection.');
    } finally {
      setSubmitting(false);
    }
  }, [session, currentQ, answer, timer, submitting, isListening]);

  const handleNext = () => isLast ? handleComplete() : nextQuestion();

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const { data } = await completeSession(session.sessionId);
      finishInterview(data);
      navigate('/feedback');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate telemetry report.');
      setCompleting(false);
    }
  };

  const handleHint = async () => {
    if (!session || !currentQ || hintsLeft <= 0) return;
    try {
      const { data } = await getHint(session.sessionId, currentQ._id);
      setHint(data.hint || 'No more hints available.');
      setHintsLeft(data.hintsLeft ?? 0);
    } catch { setHint('Failed to retrieve hint from engine.'); }
  };

  const scoreColor = (s) => s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--accent-cyan)' : s >= 40 ? 'var(--warning)' : 'var(--danger)';

  if (!session) {
    return (
      <div className="flex items-center justify-center page flex-col gap-4">
        <AlertTriangle size={48} className="text-text-tertiary" />
        <p className="text-secondary">No active session detected.</p>
        <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>Initialize Session</button>
      </div>
    );
  }

  if (completing) {
    return (
      <div className="flex items-center justify-center page flex-col gap-6">
        <Loader2 size={48} className="spin text-accent-blue" style={{ animation: 'spin 1.5s linear infinite' }} />
        <h3 style={{ fontSize: '1.5rem' }}>Compiling Analytics Report</h3>
        <p className="text-secondary">The engine is synthesizing your performance data...</p>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Parameters</p>
        <div className="flex flex-col gap-2">
          {[['Role', session.role], ['Level', session.level], ['Round', session.roundType]].map(([k, v]) => (
            <div key={k} className="flex justify-between" style={{ fontSize: '0.85rem' }}>
              <span className="text-secondary">{k}</span>
              <span style={{ fontWeight: 500, textTransform: 'capitalize', textAlign: 'right' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {session.extractedSkills?.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Context Vectors</p>
          <div className="flex flex-wrap gap-2">
            {session.extractedSkills.slice(0, 10).map((s, i) => <span key={i} className="badge badge-brand" style={{ fontSize: '0.7rem' }}>{s}</span>)}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sequence</p>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, i) => (
            <div key={i} style={{
              width: '32px', height: '32px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 600,
              background: i === currentQuestionIndex ? 'var(--accent-blue)' : i < currentQuestionIndex ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
              color: i === currentQuestionIndex ? '#fff' : i < currentQuestionIndex ? 'var(--success)' : 'var(--text-tertiary)',
              border: `1px solid ${i === currentQuestionIndex ? 'var(--accent-blue)' : i < currentQuestionIndex ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-strong)'}`,
              transition: 'all 0.3s'
            }}>{i + 1}</div>
          ))}
        </div>
      </div>

      <button className="btn w-full" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        onClick={() => { if (window.confirm('Abort session? Partial telemetry will be saved.')) handleComplete(); }}>
        Abort Session
      </button>
    </>
  );

  return (
    <div className="page" style={{ paddingTop: '72px', minHeight: '100vh' }}>
      
      {/* Top Bar */}
      <div style={{ position: 'fixed', top: '72px', left: 0, right: 0, zIndex: 50, background: 'rgba(10, 10, 12, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 24px' }}>
        <div className="container flex items-center gap-4" style={{ maxWidth: '1000px', padding: 0 }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '6px' }} onClick={() => setShowSidebar(true)}>
            <Menu size={20} />
          </button>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{currentQuestionIndex + 1} / {questions.length}</span>
          <div style={{ flex: 1, height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--gradient-brand)', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.1rem', fontWeight: 600, color: timer.isDanger ? 'var(--danger)' : timer.isWarning ? 'var(--warning)' : 'var(--text-primary)', transition: 'color 0.3s' }}>
            {timer.formatTime(timer.timeLeft)}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowSidebar(false)} />
          <div className="slide-up" style={{ position: 'relative', width: '320px', maxWidth: '85vw', background: 'var(--bg-base)', borderRight: '1px solid var(--border-subtle)', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', zIndex: 201, animation: 'slideRight 0.3s ease' }}>
            <div className="flex justify-between items-center mb-6">
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Telemetry</span>
              <button onClick={() => setShowSidebar(false)} className="btn btn-ghost" style={{ padding: '4px' }}><X size={20} /></button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="container" style={{ maxWidth: '1000px', paddingTop: '48px', paddingBottom: '80px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px', alignItems: 'start' }}>
        
        {/* Left Column */}
        <div className="flex" style={{ flexDirection: 'column', gap: '24px' }}>
          
          {/* Question Box */}
          <div className="card slide-up" style={{ background: 'var(--bg-elevated)', borderLeft: '3px solid var(--accent-blue)' }}>
            <div className="flex items-center gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
              <span className="badge badge-purple">{currentQ?.type}</span>
              <span className="badge badge-outline">{currentQ?.difficulty}</span>
              {hint && <span className="flex items-center gap-1 ml-auto text-warning" style={{ fontSize: '0.75rem', fontWeight: 600 }}><Lightbulb size={14} /> HINT ACTIVE</span>}
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 400, lineHeight: 1.8, color: 'var(--text-primary)', fontFamily: 'Inter' }}>{currentQ?.question}</p>
            {hint && (
              <div className="mt-4 p-4" style={{ background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--warning)', display: 'flex', gap: '8px' }}><Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> {hint}</p>
              </div>
            )}
          </div>

          {/* Answering Phase */}
          {qPhase === 'answering' && (
            <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex justify-between items-center">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input Buffer</label>
                {isSupported && (
                  <div className="flex items-center gap-3">
                    {isListening && <span className="text-danger" style={{ fontSize: '0.75rem', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>● RECORDING</span>}
                    <button onClick={handleMicToggle} 
                      style={{ 
                        width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s',
                        background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-elevated)', border: `1px solid ${isListening ? 'var(--danger)' : 'var(--border-strong)'}`, color: isListening ? 'var(--danger)' : 'var(--text-primary)'
                      }}>
                      {isListening ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
                    </button>
                  </div>
                )}
              </div>

              <textarea ref={textAreaRef} className="form-textarea"
                style={{ minHeight: '200px', fontSize: '0.95rem', lineHeight: 1.7, background: 'var(--bg-base)' }}
                placeholder="Initialize input via keyboard or microphone..."
                value={answer} onChange={e => setAnswer(e.target.value)} />

              {error && <div className="flex items-center gap-2 text-danger" style={{ fontSize: '0.85rem' }}><AlertTriangle size={16} /> {error}</div>}

              <div className="flex items-center gap-3 mt-2" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={handleHint} disabled={hintsLeft === 0}>
                  <Lightbulb size={16} /> Hint ({hintsLeft} rem, -5pts)
                </button>
                <div style={{ flex: 1 }} />
                <button className="btn btn-ghost" onClick={() => handleSubmit(false)}><SkipForward size={16} /> Skip</button>
                <button className="btn btn-brand" onClick={() => handleSubmit(false)} disabled={submitting || !answer.trim()}>
                  {submitting ? <><Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Processing</> : <><Send size={16} /> Submit</>}
                </button>
              </div>
            </div>
          )}

          {/* Evaluation Phase */}
          {qPhase === 'evaluated' && evaluation && (
            <div className="card scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderColor: scoreColor(evaluation.score) }}>
              <div className="flex gap-6 items-start" style={{ flexWrap: 'wrap' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: 'var(--radius-full)', flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  border: `3px solid ${scoreColor(evaluation.score)}`, background: `${scoreColor(evaluation.score)}15`
                }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 800, color: scoreColor(evaluation.score), fontFamily: 'Outfit' }}>{evaluation.score}</span>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: scoreColor(evaluation.score) }}>{evaluation.band}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>{evaluation.feedback}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { key: 'correctness', label: 'Correctness', bg: 'var(--accent-blue)' },
                  { key: 'depth', label: 'Technical Depth', bg: 'var(--accent-purple)' },
                  { key: 'communication', label: 'Communication', bg: 'var(--success)' },
                  { key: 'examples', label: 'Practical Examples', bg: 'var(--warning)' },
                ].map(a => (
                  <div key={a.key} className="flex flex-col gap-1">
                    <div className="flex justify-between" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      <span>{a.label}</span><span>{evaluation[a.key]} / 25</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-base)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(evaluation[a.key] / 25) * 100}%`, height: '100%', background: a.bg, borderRadius: '3px', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid-2 mt-2">
                {evaluation.strengths?.length > 0 && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <p className="flex items-center gap-2 text-success" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}><CheckCircle2 size={14} /> Strengths</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {evaluation.strengths.map((s, i) => <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                {evaluation.improvements?.length > 0 && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                    <p className="flex items-center gap-2 text-warning" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase' }}><AlertTriangle size={14} /> Deltas</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {evaluation.improvements.map((s, i) => <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>• {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {evaluation.suggestedAnswer && (
                <details style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
                  <summary style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lightbulb size={16} className="text-accent-blue" /> Optimal Synthesized Answer
                  </summary>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '12px', paddingLeft: '24px' }}>{evaluation.suggestedAnswer}</p>
                </details>
              )}

              <button className="btn btn-primary btn-lg w-full mt-2" onClick={handleNext}>
                {isLast ? 'Complete Sequence' : 'Next Question'} <SkipForward size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column (Desktop Sidebar) */}
        <div style={{ position: 'sticky', top: '104px', display: window.innerWidth > 900 ? 'block' : 'none' }}>
          <SidebarContent />
        </div>
      </div>
    </div>
  );
}
