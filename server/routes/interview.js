const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { evaluateAnswer, generateSessionFeedback, getNextDifficulty } = require('../services/aiService');
const { queryKnowledgeChunks } = require('../services/ragService');

// POST /api/interview/submit-answer
// Evaluates an answer and updates session; returns score + next question difficulty and retrieved context chunks
router.post('/submit-answer', async (req, res) => {
  try {
    const { sessionId, questionId, answer, timeSpent, language } = req.body;
    if (!sessionId || !questionId) {
      return res.status(400).json({ error: 'sessionId and questionId required' });
    }

    const session = await Session.findOne({ sessionId, status: 'active' });
    if (!session) return res.status(404).json({ error: 'Active session not found' });

    const q = session.questions.id(questionId);
    if (!q) return res.status(404).json({ error: 'Question not found in session' });

    q.answer = answer || '';
    q.timeSpent = timeSpent || 0;
    q.skipped = !answer || answer.trim().length < 5;

    // Retrieve RAG context chunks for this question
    let combinedContextChunks = [...(q.contextChunks || [])];

    // Perform a dynamic query on the session's overall knowledge chunks based on candidate response
    if (session.knowledgeChunks && session.knowledgeChunks.length > 0) {
      const searchResults = await queryKnowledgeChunks(
        session.knowledgeChunks,
        `${q.question} ${q.answer}`,
        3
      );
      searchResults.forEach(chunk => {
        if (!combinedContextChunks.includes(chunk.text)) {
          combinedContextChunks.push(chunk.text);
        }
      });
    }

    // Save final combined context chunks in the question record
    q.contextChunks = combinedContextChunks;

    // Evaluate the answer using multi-axis rubric + injected context chunks
    const evaluation = await evaluateAnswer({
      question: q.question,
      answer: q.answer,
      type: q.type,
      difficulty: q.difficulty,
      expectedKeyPoints: q.evaluation?._expectedKeyPoints || [],
      hintsUsed: q.hintsUsed,
      contextChunks: combinedContextChunks,
      starterCode: q.starterCode,
      language: language,
    });

    q.evaluation = {
      ...evaluation,
      _expectedKeyPoints: q.evaluation?._expectedKeyPoints,
      _hints: q.evaluation?._hints,
    };

    // Compute adaptive difficulty for next question
    const answeredQuestions = session.questions.filter(ques => ques.evaluation?.score != null);
    const recentScores = answeredQuestions.slice(-2).map(ques => ques.evaluation.score);
    const nextDifficulty = getNextDifficulty(recentScores, q.difficulty);

    await session.save();

    res.json({
      evaluation: {
        score: evaluation.score,
        correctness: evaluation.correctness,
        depth: evaluation.depth,
        communication: evaluation.communication,
        examples: evaluation.examples,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        suggestedAnswer: evaluation.suggestedAnswer,
        band: evaluation.band,
        inlineCorrections: evaluation.inlineCorrections || [],
        refactoredAnswer: evaluation.refactoredAnswer || '',
      },
      nextDifficulty,
      answeredCount: answeredQuestions.length + 1,
      contextChunks: combinedContextChunks, // Provide to frontend for diagnostic inspection
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/interview/complete
// Finalizes session, computes overall score + skill radar + AI report
router.post('/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const answeredQs = session.questions.filter(q => q.evaluation?.score != null && !q.skipped);
    
    if (answeredQs.length === 0) {
      return res.status(400).json({ error: 'No answered questions to evaluate' });
    }

    // Compute overall score (weighted: harder questions worth more)
    const difficultyWeights = { easy: 1, medium: 1.5, hard: 2 };
    let totalWeightedScore = 0;
    let totalWeight = 0;
    for (const q of answeredQs) {
      const weight = difficultyWeights[q.difficulty] || 1;
      totalWeightedScore += (q.evaluation.score * weight);
      totalWeight += weight;
    }
    const overallScore = Math.round(totalWeightedScore / totalWeight);
    const band = overallScore >= 85 ? 'Excellent' : overallScore >= 65 ? 'Good' : overallScore >= 40 ? 'Average' : 'Needs Improvement';

    // Generate holistic AI feedback
    const feedback = await generateSessionFeedback({
      role: session.role,
      level: session.level,
      questions: answeredQs,
      overallScore,
    });

    session.overallScore = overallScore;
    session.band = band;
    session.skillRadar = feedback.skillRadar;
    session.status = 'completed';
    session.completedAt = new Date();

    await session.save();

    res.json({
      overallScore,
      band,
      skillRadar: feedback.skillRadar,
      executiveSummary: feedback.executiveSummary,
      topStrengths: feedback.topStrengths,
      criticalGaps: feedback.criticalGaps,
      studyPlan: feedback.studyPlan,
      hiringRecommendation: feedback.hiringRecommendation,
      questionBreakdown: answeredQs.map(q => ({
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        score: q.evaluation.score,
        feedback: q.evaluation.feedback,
        strengths: q.evaluation.strengths,
        improvements: q.evaluation.improvements,
        suggestedAnswer: q.evaluation.suggestedAnswer,
        inlineCorrections: q.evaluation.inlineCorrections || [],
        refactoredAnswer: q.evaluation.refactoredAnswer || '',
        answer: q.answer || '',
        hintsUsed: q.hintsUsed,
        timeSpent: q.timeSpent,
      })),
    });
  } catch (err) {
    console.error('Complete session error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
