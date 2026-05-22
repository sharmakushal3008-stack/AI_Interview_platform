const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractPdfText } = require('../services/pdfService');

const crypto = require('crypto');
const Session = require('../models/Session');
const { generateQuestions, extractSkillsFromResume, getNextDifficulty } = require('../services/aiService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/session/start
// Creates a new session, parses resume, generates adaptive question bank
router.post('/start', upload.single('resume'), async (req, res) => {
  try {
    const { role, level, roundType } = req.body;
    if (!role || !level || !roundType) {
      return res.status(400).json({ error: 'role, level, roundType are required' });
    }

    let resumeText = '';
    let extractedSkills = [];

    if (req.file) {
      resumeText = await extractPdfText(req.file.buffer);
      extractedSkills = await extractSkillsFromResume(resumeText);
    }

    const questionDrafts = await generateQuestions({
      role, level, roundType, skills: extractedSkills, count: 8
    });

    const session = new Session({
      sessionId: crypto.randomUUID(),
      role, level, roundType,
      resumeText,
      extractedSkills,
      questions: questionDrafts.map(q => ({
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        // Store hints and expectedKeyPoints in a way we can access server-side
        // We embed them temporarily; client never sees expected answers
        evaluation: {
          score: null,
          feedback: null,
          strengths: [],
          improvements: [],
          suggestedAnswer: '',
          _expectedKeyPoints: q.expectedKeyPoints,
          _hints: q.followUpHints,
        },
        timeSpent: 0,
        hintsUsed: 0,
      })),
      status: 'active',
    });

    await session.save();

    // Return session to client — but strip expected answers / hints from response
    const clientQuestions = session.questions.map(q => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      timeLimit: 180,
    }));

    res.json({
      sessionId: session.sessionId,
      extractedSkills,
      questions: clientQuestions,
      role, level, roundType,
    });
  } catch (err) {
    console.error('Session start error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session/hint/:sessionId/:questionId
router.get('/hint/:sessionId/:questionId', async (req, res) => {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const q = session.questions.id(req.params.questionId);
    if (!q) return res.status(404).json({ error: 'Question not found' });

    const hints = q.evaluation?._hints || [];
    const hintIdx = q.hintsUsed;

    if (hintIdx >= hints.length) {
      return res.json({ hint: null, hintsLeft: 0 });
    }

    q.hintsUsed = hintIdx + 1;
    await session.save();

    res.json({
      hint: hints[hintIdx],
      hintsLeft: hints.length - q.hintsUsed,
      hintsUsed: q.hintsUsed,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/session/history/all
router.get('/history/all', async (req, res) => {
  try {
    const sessions = await Session.find({ status: 'completed' })
      .select('sessionId role level roundType overallScore band startedAt completedAt skillRadar')
      .sort({ completedAt: -1 })
      .limit(20);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
