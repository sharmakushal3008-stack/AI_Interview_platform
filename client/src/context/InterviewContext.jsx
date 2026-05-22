import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const InterviewContext = createContext(null);

const STORAGE_KEY = 'interviewai_session';
const FEEDBACK_KEY = 'interviewai_feedback';

// ── helpers ──────────────────────────────────────────────────────────────────
const save = (key, value) => {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
};
const load = (key) => {
  try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
};
const clear = (...keys) => keys.forEach(k => sessionStorage.removeItem(k));

// ─────────────────────────────────────────────────────────────────────────────

export function InterviewProvider({ children }) {
  // Hydrate from sessionStorage on first mount
  const stored = load(STORAGE_KEY);
  const storedFeedback = load(FEEDBACK_KEY);

  const [session, setSession]               = useState(stored?.session || null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(stored?.currentQuestionIndex || 0);
  const [answers, setAnswers]               = useState(stored?.answers || {});
  const [scores, setScores]                 = useState(stored?.scores || []);
  const [feedbackReport, setFeedbackReport] = useState(storedFeedback || null);
  const [phase, setPhaseState]              = useState(stored?.phase || (storedFeedback ? 'feedback' : 'onboarding'));

  // Sync to sessionStorage whenever key state changes
  useEffect(() => {
    if (session) {
      save(STORAGE_KEY, { session, currentQuestionIndex, answers, scores, phase });
    }
  }, [session, currentQuestionIndex, answers, scores, phase]);

  useEffect(() => {
    if (feedbackReport) save(FEEDBACK_KEY, feedbackReport);
  }, [feedbackReport]);

  const setPhase = useCallback((p) => setPhaseState(p), []);

  const startInterview = useCallback((sessionData) => {
    clear(STORAGE_KEY, FEEDBACK_KEY);
    setSession(sessionData);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setScores([]);
    setFeedbackReport(null);
    setPhaseState('interview');
  }, []);

  const recordAnswer = useCallback((questionId, answerData) => {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: answerData };
      return next;
    });
    if (answerData.evaluation?.score != null) {
      setScores(prev => [...prev, answerData.evaluation.score]);
    }
  }, []);

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev + 1);
  }, []);

  const finishInterview = useCallback((report) => {
    setFeedbackReport(report);
    setPhaseState('feedback');
    // Keep session in storage but save feedback separately
    save(FEEDBACK_KEY, report);
  }, []);

  const reset = useCallback(() => {
    clear(STORAGE_KEY, FEEDBACK_KEY);
    setSession(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setScores([]);
    setFeedbackReport(null);
    setPhaseState('onboarding');
  }, []);

  return (
    <InterviewContext.Provider value={{
      session, currentQuestionIndex, answers, scores,
      feedbackReport, phase,
      startInterview, recordAnswer, nextQuestion, finishInterview, reset, setPhase,
    }}>
      {children}
    </InterviewContext.Provider>
  );
}

export const useInterview = () => {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
};
