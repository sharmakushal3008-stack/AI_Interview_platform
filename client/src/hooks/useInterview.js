import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Web Speech API hook for browser-native STT.
 * Falls back gracefully if unsupported.
 */
export function useSpeechToText({ onResult, onError }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += t + ' ';
          else interimTranscript += t;
        }
        const combined = finalTranscript || interimTranscript;
        setTranscript(combined);
        if (finalTranscript && onResult) onResult(finalTranscript.trim());
      };

      recognition.onerror = (event) => {
        console.error('STT error:', event.error);
        setIsListening(false);
        if (onError) onError(event.error);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }

    return () => recognitionRef.current?.abort();
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    setTranscript('');
    recognitionRef.current.start();
    setIsListening(true);
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => setTranscript(''), []);

  return { isListening, transcript, isSupported, startListening, stopListening, resetTranscript };
}

/**
 * Interview timer hook with pause/resume support.
 */
export function useTimer(initialSeconds = 180) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((secs = initialSeconds) => {
    setIsRunning(false);
    setTimeLeft(secs);
    setElapsed(0);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isWarning = timeLeft <= 30 && timeLeft > 0;
  const isDanger = timeLeft <= 10 && timeLeft > 0;
  const isExpired = timeLeft === 0;

  return { timeLeft, elapsed, isRunning, isWarning, isDanger, isExpired, start, pause, reset, formatTime };
}
