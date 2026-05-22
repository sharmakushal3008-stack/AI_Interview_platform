const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractPdfText } = require('../services/pdfService');
const { analyzeResume } = require('../services/resumeService');
const { buildResumeWithAI } = require('../services/aiService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/resume/analyze
router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    const { targetRole, targetLevel } = req.body;

    if (!req.file) return res.status(400).json({ error: 'Resume PDF is required.' });
    if (!targetRole) return res.status(400).json({ error: 'Target role is required.' });

    const resumeText = await extractPdfText(req.file.buffer);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract text from PDF. Please ensure it is not a scanned image.' });
    }

    const analysis = await analyzeResume({
      resumeText,
      targetRole: targetRole || 'Software Engineer',
      targetLevel: targetLevel || 'mid',
    });

    res.json({ ...analysis, resumeLength: resumeText.length });
  } catch (err) {
    console.error('Resume analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resume/build
// Uses AI to build a resume based on user prompt
router.post('/build', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    const resumeData = await buildResumeWithAI(prompt);
    res.json(resumeData);
  } catch (err) {
    console.error('Build resume error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
