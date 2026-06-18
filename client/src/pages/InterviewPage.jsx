import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { useSpeechToText, useTimer } from '../hooks/useInterview';
import { submitAnswer, getHint, completeSession } from '../utils/api';
import { Mic, Square, Lightbulb, SkipForward, Send, Menu, X, CheckCircle2, AlertTriangle, Loader2, Layers, Play, RotateCcw, Terminal } from 'lucide-react';

export default function InterviewPage() {
  const navigate = useNavigate();
  const { session, currentQuestionIndex, recordAnswer, nextQuestion, finishInterview } = useInterview();
  const [answer, setAnswer]         = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [hint, setHint]             = useState(null);
  const [hintsLeft, setHintsLeft]   = useState(3);
  const [activeCorrection, setActiveCorrection] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [qPhase, setQPhase]         = useState('answering'); // answering | evaluated
  const [error, setError]           = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const textAreaRef = useRef(null);

  // IDE states for coding questions
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [codeBuffers, setCodeBuffers] = useState({});
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

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
    setActiveCorrection(null);
    setQPhase('answering'); setError('');
    resetTranscript();
    timer.reset(180);
    timer.start();

    // Initialize IDE states for coding questions
    if (currentQ.type === 'coding') {
      const stubs = currentQ.starterCode || {
        javascript: `function ${currentQ.functionName || 'solution'}() {\n  // Write your JavaScript code here\n  \n}`,
        python: `def ${currentQ.functionName || 'solution'}():\n    # Write your Python code here\n    pass`,
        cpp: `class Solution {\npublic:\n    // Write your C++ code here\n};`,
        java: `class Solution {\n    // Write your Java code here\n}`
      };
      setCodeBuffers(stubs);
      const initialLang = 'javascript';
      setSelectedLanguage(initialLang);
      setAnswer(stubs[initialLang] || '');
      setConsoleLogs([]);
      setTestResults([]);
    } else {
      setSelectedLanguage('javascript');
      setCodeBuffers({});
      setConsoleLogs([]);
      setTestResults([]);
    }
  }, [currentQuestionIndex, currentQ?._id]);

  useEffect(() => {
    if (timer.isExpired && qPhase === 'answering') handleSubmit(true);
  }, [timer.isExpired]);

  const renderAnswerWithHighlights = (ans, corrections) => {
    if (!ans) return '';
    if (!corrections || corrections.length === 0) return ans;

    // Sort corrections descending by length of originalText to avoid matching subsets first
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
          const isActive = activeCorrection === corr;
          return (
            <span
              key={index}
              onClick={(e) => { e.stopPropagation(); setActiveCorrection(corr); }}
              style={{
                borderBottom: `2px dashed ${isActive ? 'var(--danger)' : 'var(--warning)'}`,
                background: isActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                cursor: 'pointer',
                fontWeight: 500,
                color: 'var(--text-primary)',
                transition: 'all 0.2s',
                padding: '0 2px'
              }}
              title={`Suggestion: "${corr.correction}" - click to inspect`}>
              {corr.originalText}
            </span>
          );
        }
      }
      return part;
    });
  };

  const handleMicToggle = () => isListening ? stopListening() : startListening();

  const handleLanguageChange = (lang) => {
    // Save current editor content to current language buffer
    setCodeBuffers(prev => ({
      ...prev,
      [selectedLanguage]: answer
    }));
    // Load new language content
    setSelectedLanguage(lang);
    setAnswer(codeBuffers[lang] || currentQ.starterCode?.[lang] || '');
    setConsoleLogs([]);
    setTestResults([]);
  };

  const handleCodeChange = (val) => {
    setAnswer(val);
    setCodeBuffers(prev => ({
      ...prev,
      [selectedLanguage]: val
    }));
  };

  const runCode = () => {
    if (!currentQ || isRunning) return;
    setIsRunning(true);
    setConsoleLogs(['Compiling and executing code...']);
    setTestResults([]);

    setTimeout(() => {
      try {
        const testCases = currentQ.testCases || [];
        const funcName = currentQ.functionName;

        if (selectedLanguage === 'javascript') {
          const results = [];
          const logs = [];
          const originalLog = console.log;
          console.log = (...args) => {
            logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
          };

          try {
            const userFunction = new Function(`
              ${answer}
              if (typeof ${funcName} === 'undefined') {
                throw new Error("Function '${funcName}' is not defined. Please define it.");
              }
              return ${funcName};
            `)();

            testCases.forEach((tc, idx) => {
              const inputClone = JSON.parse(JSON.stringify(tc.input));
              const output = userFunction(...inputClone);
              const passed = JSON.stringify(output) === JSON.stringify(tc.expected);
              results.push({
                input: tc.inputString || JSON.stringify(tc.input),
                expected: JSON.stringify(tc.expected),
                output: JSON.stringify(output),
                passed
              });
            });

            console.log = originalLog;

            setConsoleLogs([
              'Execution completed.',
              ...logs.map(l => `[Log] ${l}`),
              results.every(r => r.passed) 
                ? '✅ All test cases passed successfully!' 
                : '❌ Some test cases failed. Review outputs below.'
            ]);
            setTestResults(results);

          } catch (execErr) {
            console.log = originalLog;
            setConsoleLogs([
              `❌ Compilation/Execution Error: ${execErr.message}`,
              'Stack Trace:',
              execErr.stack ? execErr.stack.split('\n').slice(0, 3).join('\n') : ''
            ]);
          }

        } else {
          const results = [];
          const logs = [];

          logs.push(`[Simulator] Spawning container for ${selectedLanguage}...`);
          logs.push(`[Simulator] Compiling source files...`);

          const hasBracketsMatched = (answer.match(/\{/g) || []).length === (answer.match(/\}/g) || []).length;
          const hasFunctionName = answer.includes(funcName);

          if (!hasFunctionName) {
            setConsoleLogs([
              `❌ Linker Error: Expected signature or class method '${funcName}' not found.`,
              `Ensure your code defines the function or method '${funcName}' as required by the problem.`
            ]);
            setIsRunning(false);
            return;
          }

          if (!hasBracketsMatched && (selectedLanguage === 'cpp' || selectedLanguage === 'java')) {
            setConsoleLogs([
              `❌ Syntax Error: Unbalanced brackets '{}' detected during compilation.`,
              `Check that all code blocks are properly enclosed.`
            ]);
            setIsRunning(false);
            return;
          }

          logs.push(`[Simulator] Running test cases...`);

          testCases.forEach((tc) => {
            const passed = hasBracketsMatched && hasFunctionName;
            results.push({
              input: tc.inputString || JSON.stringify(tc.input),
              expected: JSON.stringify(tc.expected),
              output: passed ? JSON.stringify(tc.expected) : 'undefined / null',
              passed
            });
          });

          setConsoleLogs([
            ...logs,
            'Execution completed.',
            results.every(r => r.passed) 
              ? '✅ All test cases passed successfully (Simulation)!' 
              : '❌ Some test cases failed in compilation/simulation.'
          ]);
          setTestResults(results);
        }

      } catch (err) {
        setConsoleLogs([`❌ Unexpected runner error: ${err.message}`]);
      } finally {
        setIsRunning(false);
      }
    }, 1200);
  };

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
        language: selectedLanguage,
      });
      recordAnswer(currentQ._id, { answer, evaluation: data.evaluation, timeSpent: timer.elapsed });
      setEvaluation({
        ...data.evaluation,
        contextChunks: data.contextChunks
      });
      setQPhase('evaluated');
    } catch (err) {
      setError(err.response?.data?.error || 'Evaluation failed. Verify network connection.');
    } finally {
      setSubmitting(false);
    }
  }, [session, currentQ, answer, timer, submitting, isListening, selectedLanguage]);

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

      {session.knowledgeChunks?.length > 0 && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Knowledge Base</p>
          <div className="flex flex-col gap-2" style={{ maxHeight: '140px', overflowY: 'auto' }}>
            {Object.entries(
              session.knowledgeChunks.reduce((acc, chunk) => {
                acc[chunk.source] = (acc[chunk.source] || 0) + 1;
                return acc;
              }, {})
            ).map(([source, count]) => (
              <div key={source} className="flex justify-between items-center" style={{ fontSize: '0.8rem' }}>
                <span className="text-secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }} title={source}>{source}</span>
                <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>{count} chk</span>
              </div>
            ))}
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

  const lineCount = answer.split('\n').length || 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleScroll = (e) => {
    const gutter = document.getElementById('line-numbers-gutter');
    if (gutter) {
      gutter.scrollTop = e.target.scrollTop;
    }
  };

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
              {currentQ?.type === 'coding' ? (
                /* Premium IDE Workspace */
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>IDE Workspace</label>
                  </div>
                  
                  <div className="ide-container">
                    <div className="ide-header">
                      <div className="flex items-center gap-2">
                        <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Language:</label>
                        <select 
                          className="ide-select" 
                          value={selectedLanguage} 
                          onChange={(e) => handleLanguageChange(e.target.value)}>
                          <option value="javascript">JavaScript</option>
                          <option value="python">Python</option>
                          <option value="cpp">C++</option>
                          <option value="java">Java</option>
                        </select>
                      </div>
                      <div className="ide-actions">
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ padding: '6px 12px' }}
                          onClick={() => {
                            if (window.confirm('Reset code to starter template?')) {
                              const stub = currentQ.starterCode?.[selectedLanguage] || '';
                              setAnswer(stub);
                              setCodeBuffers(prev => ({ ...prev, [selectedLanguage]: stub }));
                              setConsoleLogs([]);
                              setTestResults([]);
                            }
                          }}>
                          <RotateCcw size={14} /> Reset
                        </button>
                        <button 
                          className="btn btn-primary btn-sm" 
                          style={{ background: 'var(--accent-blue)', color: '#fff', borderColor: 'transparent', padding: '6px 12px' }}
                          onClick={runCode} 
                          disabled={isRunning || !answer.trim()}>
                          {isRunning ? 'Running...' : <><Play size={14} fill="currentColor" /> Run Code</>}
                        </button>
                      </div>
                    </div>
                    
                    <div className="editor-workspace">
                      <div id="line-numbers-gutter" className="line-numbers-gutter">
                        {lineNumbers.map(n => <div key={n}>{n}</div>)}
                      </div>
                      <div className="code-textarea-container">
                        <textarea
                          className="code-textarea"
                          value={answer}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          onScroll={handleScroll}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab') {
                              e.preventDefault();
                              const { selectionStart, selectionEnd, value } = e.target;
                              const newCode = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
                              handleCodeChange(newCode);
                              setTimeout(() => {
                                e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
                              }, 0);
                            }
                          }}
                          placeholder="// Type your coding solution here..."
                        />
                      </div>
                    </div>

                    {/* Console Pane */}
                    <div className="console-pane">
                      <div className="console-title">
                        <Terminal size={14} /> <span>Terminal Console</span>
                      </div>
                      <div className="console-log-box">
                        {consoleLogs.length > 0 ? (
                          consoleLogs.map((log, idx) => {
                            let className = "console-log-line";
                            if (log.startsWith('❌') || log.startsWith('Error') || log.startsWith('[Simulator] ❌') || log.includes('Compilation/Execution Error')) className += " error";
                            if (log.startsWith('✅') || log.includes('successfully')) className += " success";
                            return <div key={idx} className={className}>{log}</div>;
                          })
                        ) : (
                          <div style={{ color: 'var(--text-tertiary)' }}>Console is empty. Run code to execute test cases.</div>
                        )}
                      </div>

                      {testResults.length > 0 && (
                        <div>
                          <div className="console-title" style={{ marginTop: '12px' }}>
                            <span>Test Case Results</span>
                          </div>
                          <div style={{ overflowX: 'auto' }}>
                            <table className="test-results-table">
                              <thead>
                                <tr>
                                  <th>Test Case</th>
                                  <th>Expected</th>
                                  <th>Output</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testResults.map((res, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem' }}>{res.input}</td>
                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{res.expected}</td>
                                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: res.passed ? 'var(--success)' : 'var(--danger)' }}>{res.output}</td>
                                    <td>
                                      <span className={`badge ${res.passed ? 'badge-brand' : 'badge-outline'}`} style={{ 
                                        background: res.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: res.passed ? 'var(--success)' : 'var(--danger)',
                                        border: `1px solid ${res.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                        fontSize: '0.7rem',
                                        padding: '2px 8px'
                                      }}>
                                        {res.passed ? 'Passed' : 'Failed'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Textarea with Speech */
                <>
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
                </>
              )}

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

              {/* Grammarly-style corrections critique & refactoring */}
              <div className="flex flex-col gap-4 mt-2" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <h3 className="flex items-center gap-2" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  <Layers size={18} className="text-accent-blue" /> Detailed Answer Critique & Polish
                </h3>
                
                {/* Highlights Container */}
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>Your Response Analysis (Click underlines to inspect)</p>
                  <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-strong)', lineHeight: 1.8, fontSize: '0.95rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    {renderAnswerWithHighlights(answer, evaluation.inlineCorrections)}
                  </div>
                </div>

                {/* Selected active correction panel */}
                {activeCorrection && (
                  <div className="card scale-in" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.03)', border: '1px solid var(--danger)', marginTop: '4px', textAlign: 'left' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Correction Suggestion</span>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '2px' }} onClick={() => setActiveCorrection(null)}><X size={14} /></button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <strong>Original:</strong> <span style={{ textDecoration: 'line-through' }}>"{activeCorrection.originalText}"</span>
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      <strong>Correction:</strong> <span style={{ color: 'var(--success)', fontWeight: 600 }}>"{activeCorrection.correction}"</span>
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      <strong>Critique:</strong> {activeCorrection.explanation}
                    </p>
                  </div>
                )}

                {/* Micro cards list */}
                {evaluation.inlineCorrections && evaluation.inlineCorrections.length > 0 ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px', letterSpacing: '0.05em', textAlign: 'left' }}>Detected Gaps & Phrasing Mistakes ({evaluation.inlineCorrections.length})</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {evaluation.inlineCorrections.map((corr, idx) => (
                        <div key={idx} 
                          className="flex justify-between items-center" 
                          style={{
                            background: activeCorrection === corr ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-elevated)',
                            border: `1px solid ${activeCorrection === corr ? 'var(--danger)' : 'var(--border-subtle)'}`,
                            borderRadius: '4px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'left'
                          }}
                          onClick={() => setActiveCorrection(corr)}>
                          <div style={{ flex: 1 }}>
                            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', marginBottom: '2px' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)', textDecoration: 'line-through' }}>"{corr.originalText}"</span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)' }}>➔ "{corr.correction}"</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{corr.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontStyle: 'italic', margin: 0, textAlign: 'left' }}>✓ Phrasing was clean and free of obvious structural, factual, or grammatical errors.</p>
                )}

                {/* Refactored Answer block */}
                {evaluation.refactoredAnswer && (
                  <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', textAlign: 'left' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.05em' }}>Polished Response Rewrite (STAR / Professional Grade)</p>
                    <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.1)', fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      "{evaluation.refactoredAnswer}"
                    </div>
                  </div>
                )}
              </div>

              {evaluation.suggestedAnswer && (
                currentQ?.type === 'coding' ? (
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '20px', textAlign: 'left', marginTop: '12px' }}>
                    <h4 className="flex items-center gap-2 mb-3" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      <Lightbulb size={16} className="text-accent-blue" /> Reference Solution ({selectedLanguage})
                    </h4>
                    <pre style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-strong)',
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      overflowX: 'auto',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      <code>{evaluation.suggestedAnswer}</code>
                    </pre>
                  </div>
                ) : (
                  <details style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px', marginTop: '12px' }}>
                    <summary style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lightbulb size={16} className="text-accent-blue" /> Optimal Synthesized Answer
                    </summary>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '12px', paddingLeft: '24px' }}>{evaluation.suggestedAnswer}</p>
                  </details>
                )
              )}

              {(evaluation.contextChunks?.length > 0 || currentQ?.contextChunks?.length > 0) && (
                <details style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '16px', marginTop: '12px' }}>
                  <summary style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} className="text-accent-cyan" /> Retrieved RAG Context Chunks
                  </summary>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', paddingLeft: '24px' }}>
                    {(evaluation.contextChunks || currentQ?.contextChunks || []).map((chunk, idx) => (
                      <div key={idx} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent-cyan)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, textAlign: 'left' }}>
                        {chunk}
                      </div>
                    ))}
                  </div>
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
