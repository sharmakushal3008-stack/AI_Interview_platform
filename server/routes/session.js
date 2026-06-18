const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractPdfText } = require('../services/pdfService');
const { chunkText, generateEmbedding } = require('../services/ragService');

const crypto = require('crypto');
const Session = require('../models/Session');
const { generateQuestions, extractSkillsFromResume, getNextDifficulty } = require('../services/aiService');

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit for multiple files
});

// Configure upload for both resume and multiple reference documents
const uploadFields = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'referenceDocs', maxCount: 5 }
]);

// POST /api/session/start
// Creates a new session, parses resume and reference materials, generates vector embeddings, and builds RAG questions
router.post('/start', uploadFields, async (req, res) => {
  try {
    const { role, level, roundType, referenceText } = req.body;
    if (!role || !level || !roundType) {
      return res.status(400).json({ error: 'role, level, roundType are required' });
    }

    let resumeText = '';
    let extractedSkills = [];

    // 1. Process Resume
    const resumeFile = req.files?.resume?.[0];
    if (resumeFile) {
      resumeText = await extractPdfText(resumeFile.buffer);
      extractedSkills = await extractSkillsFromResume(resumeText);
    }

    // 2. Gather reference text chunks
    const rawSourceChunks = [];
    const refFiles = req.files?.referenceDocs || [];

    for (const file of refFiles) {
      let text = '';
      if (file.mimetype === 'application/pdf') {
        text = await extractPdfText(file.buffer);
      } else {
        // Handle txt or md files
        text = file.buffer.toString('utf-8');
      }
      
      if (text.trim()) {
        const chunks = chunkText(text);
        chunks.forEach(c => {
          rawSourceChunks.push({ text: c, source: file.originalname });
        });
      }
    }

    // Process pasted text if present
    if (referenceText && referenceText.trim()) {
      const chunks = chunkText(referenceText);
      chunks.forEach(c => {
        rawSourceChunks.push({ text: c, source: 'Pasted Context' });
      });
    }

    // 3. Generate Vector Embeddings for reference chunks
    const knowledgeChunks = await Promise.all(
      rawSourceChunks.map(async (item) => {
        const embedding = await generateEmbedding(item.text);
        return {
          text: item.text,
          embedding,
          source: item.source
        };
      })
    );

    // 4. Generate RAG-tailored Questions
    const questionDrafts = await generateQuestions({
      role, level, roundType, 
      skills: extractedSkills, 
      count: 8, 
      knowledgeChunks
    });

    // 5. Create Session
    const session = new Session({
      sessionId: crypto.randomUUID(),
      role, level, roundType,
      resumeText,
      extractedSkills,
      knowledgeChunks,
      questions: questionDrafts.map(q => ({
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        starterCode: q.starterCode,
        functionName: q.functionName,
        testCases: q.testCases,
        contextChunks: q.contextChunks || [],
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

    // Strip internal answers / hints from questions sent to the client
    const clientQuestions = session.questions.map(q => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      difficulty: q.difficulty,
      timeLimit: 180,
      starterCode: q.starterCode,
      functionName: q.functionName,
      testCases: q.testCases,
    }));

    res.json({
      sessionId: session.sessionId,
      extractedSkills,
      questions: clientQuestions,
      role, level, roundType,
      knowledgeChunks: session.knowledgeChunks.map(kc => ({
        text: kc.text,
        source: kc.source
      })) // Send non-heavy knowledge chunk metadata to display in the UI
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
