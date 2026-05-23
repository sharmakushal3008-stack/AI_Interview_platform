const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getOfflineQuestions } = require('./questionBank');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// ─── Question Bank Seeding ────────────────────────────────────────────────────

/**
 * Generate interview questions based on resume skills + role.
 * Uses a structured JSON prompt so output is machine-parseable, not just text.
 */
async function generateQuestions({ role, level, roundType, skills, count = 8 }) {
  const skillList = skills.length > 0 ? skills.join(', ') : 'general software engineering';
  const levelGuide = {
    junior: 'foundational concepts, basic problem-solving, learning mindset',
    mid: 'practical application, trade-offs, moderate complexity',
    senior: 'design decisions, scalability, leadership, deep technical insight',
    lead: 'architecture, strategy, team leadership, business impact',
  }[level] || 'practical application';

  const roundGuides = {
    behavioral: 'STAR-method questions about past experiences, teamwork, conflict, leadership',
    technical: 'language/framework specifics, algorithms, debugging, code review scenarios',
    coding: 'algorithm/data structure problems with time and space complexity requirements',
    system_design: 'design distributed systems, APIs, databases — evaluate scalability and trade-offs',
    mixed: 'mix of behavioral, technical, and one coding problem',
  };

  const prompt = `You are an expert ${role} interviewer at a top tech company.
Generate exactly ${count} interview questions for a ${level}-level candidate.
Round type: ${roundType} — ${roundGuides[roundType] || roundGuides.mixed}
Candidate's skills from resume: ${skillList}

Difficulty distribution:
- ${Math.floor(count * 0.3)} easy questions
- ${Math.floor(count * 0.4)} medium questions  
- ${Math.ceil(count * 0.3)} hard questions

Return ONLY a valid JSON array. No markdown, no explanation. Schema:
[
  {
    "question": "string",
    "type": "behavioral|technical|coding|system_design|hr",
    "difficulty": "easy|medium|hard",
    "expectedKeyPoints": ["point1", "point2"],
    "followUpHints": ["hint if stuck 1", "hint if stuck 2", "hint if stuck 3"],
    "timeLimit": 120
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON array');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini generateQuestions error, falling back to local question bank:', err.message);
    return getOfflineQuestions({ role, level, roundType, skills, count });
  }
}

// ─── Local Dynamic Fallback Engines ──────────────────────────────────────────

/**
 * Dynamic offline evaluation based on keywords, key points matching, and answer length.
 */
function getOfflineEvaluation({ question, answer, type, difficulty, expectedKeyPoints, hintsUsed }) {
  const words = (answer || '').toLowerCase();
  
  let correctness = 15;
  let depth = 14;
  let communication = 16;
  let examples = 12;

  // 1. Length/depth adjustments
  const wordCount = answer.trim().split(/\s+/).length;
  if (wordCount > 100) {
    depth += 4;
    communication += 2;
  } else if (wordCount > 50) {
    depth += 2;
  } else if (wordCount < 15) {
    correctness = Math.max(5, correctness - 8);
    depth = Math.max(5, depth - 8);
    communication = Math.max(8, communication - 5);
    examples = Math.max(2, examples - 8);
  }

  // 2. Expected key points matching
  const matchedPoints = [];
  const missedPoints = [];

  (expectedKeyPoints || []).forEach(point => {
    const terms = point.toLowerCase().split(/[\s/]+/);
    const isMatched = terms.some(term => term.length > 3 && words.includes(term));
    if (isMatched) {
      matchedPoints.push(point);
      correctness += 2;
      depth += 1;
    } else {
      missedPoints.push(point);
    }
  });

  // Cap sub-scores at 25
  correctness = Math.min(25, correctness);
  depth = Math.min(25, depth);
  communication = Math.min(25, communication);
  examples = Math.min(25, examples);

  const hintPenalty = hintsUsed * 5;
  const rawScore = (correctness + depth + communication + examples) - hintPenalty;
  const score = Math.max(0, Math.min(100, rawScore));
  
  const band = score >= 85 ? 'Excellent' : score >= 65 ? 'Good' : score >= 40 ? 'Average' : 'Needs Improvement';

  // 3. Dynamic feedback generation
  const strengths = [];
  if (matchedPoints.length > 0) {
    strengths.push(`Addressed key areas: ${matchedPoints.slice(0, 2).join(', ')}.`);
  }
  if (wordCount >= 45) {
    strengths.push("Provided a well-structured and detailed explanation.");
  } else {
    strengths.push("Direct response structure.");
  }

  const improvements = [];
  if (missedPoints.length > 0) {
    improvements.push(`Address additional facets: ${missedPoints.slice(0, 2).join(', ')}.`);
  }
  if (wordCount < 30) {
    improvements.push("Elaborate further to showcase technical depth and context.");
  }
  if (hintsUsed > 0) {
    improvements.push("Try to solve complex questions with fewer hints.");
  }

  const pointsStr = expectedKeyPoints && expectedKeyPoints.length > 0 
    ? `An optimal response would cover: ${expectedKeyPoints.join(', ')}.`
    : "An optimal response would include specific examples, cover potential trade-offs, and outline a structured solution.";

  const feedback = `[LOCAL EVAL] You provided a ${band.toLowerCase()} response for this ${difficulty} question. ${
    matchedPoints.length > 0 
      ? `You successfully touched on key aspects like ${matchedPoints.join(', ')}.` 
      : "Ensure you clearly define the core concept, discuss architectural trade-offs, and state assumptions."
  }`;

  return {
    correctness,
    depth,
    communication,
    examples,
    score,
    band,
    feedback,
    strengths,
    improvements,
    suggestedAnswer: `[LOCAL SUGGESTION] ${pointsStr}`
  };
}

/**
 * Dynamic offline session report generation.
 */
function getOfflineSessionFeedback({ role, level, questions, overallScore }) {
  const allStrengths = [];
  const allImprovements = [];
  
  questions.forEach(q => {
    if (q.evaluation?.strengths) allStrengths.push(...q.evaluation.strengths);
    if (q.evaluation?.improvements) allImprovements.push(...q.evaluation.improvements);
  });

  const uniqueStrengths = [...new Set(allStrengths)].slice(0, 3);
  const uniqueGaps = [...new Set(allImprovements)].slice(0, 3);

  if (uniqueStrengths.length < 2) {
    uniqueStrengths.push("Consistent effort through the interview stages.", "Clear verbal structure.");
  }
  if (uniqueGaps.length < 2) {
    uniqueGaps.push("Deepen technical exploration of edge cases.", "Provide more concrete metrics in behavioral stories.");
  }

  const avgCorrectness = Math.round((questions.reduce((sum, q) => sum + (q.evaluation?.correctness ?? 15), 0) / questions.length) * 4);
  const avgDepth = Math.round((questions.reduce((sum, q) => sum + (q.evaluation?.depth ?? 15), 0) / questions.length) * 4);
  const avgComm = Math.round((questions.reduce((sum, q) => sum + (q.evaluation?.communication ?? 15), 0) / questions.length) * 4);
  const avgExamples = Math.round((questions.reduce((sum, q) => sum + (q.evaluation?.examples ?? 15), 0) / questions.length) * 4);

  const problemSolving = Math.min(100, Math.max(30, Math.round((avgCorrectness + avgDepth) / 2)));
  const communication = Math.min(100, Math.max(30, avgComm));
  const technicalDepth = Math.min(100, Math.max(30, avgDepth));
  const codeQuality = Math.min(100, Math.max(30, Math.round((avgCorrectness + avgExamples) / 2)));
  const systemThinking = Math.min(100, Math.max(30, Math.round((avgDepth + avgExamples) / 2)));
  const behavioralFit = Math.min(100, Math.max(30, Math.round((avgComm + avgExamples) / 2)));

  const hiringRecommendation = overallScore >= 85 ? 'Strong Hire' : overallScore >= 68 ? 'Hire' : overallScore >= 45 ? 'Borderline' : 'No Hire';

  const executiveSummary = `[LOCAL REPORT] The candidate completed the ${level}-level ${role} interview session with an overall score of ${overallScore}/100. They demonstrated solid capabilities in: ${uniqueStrengths.join(', ').toLowerCase()}. However, there are opportunities for improvement in: ${uniqueGaps.join(', ').toLowerCase()}.`;

  return {
    executiveSummary,
    topStrengths: uniqueStrengths,
    criticalGaps: uniqueGaps,
    studyPlan: [
      {
        topic: "Core Foundations & Architectural Trade-offs",
        priority: overallScore < 70 ? "high" : "medium",
        resources: ["System Design Primer", "Tech Blogs (Netflix, Uber)"]
      },
      {
        topic: "Structured Communication (STAR/PREP)",
        priority: "medium",
        resources: ["Behavioral Interview Prep Guide"]
      }
    ],
    hiringRecommendation,
    skillRadar: {
      problemSolving,
      communication,
      technicalDepth,
      codeQuality,
      systemThinking,
      behavioralFit
    }
  };
}

// ─── Answer Evaluation Engine ─────────────────────────────────────────────────

/**
 * Multi-axis rubric evaluation — not just "good/bad" but a structured score.
 * Axes: correctness, depth, communication, examples (25pts each = 100 total)
 */
async function evaluateAnswer({ question, answer, type, difficulty, expectedKeyPoints, hintsUsed }) {
  if (!answer || answer.trim().length < 10) {
    return {
      score: 0,
      correctness: 0, depth: 0, communication: 0, examples: 0,
      feedback: 'No meaningful answer provided.',
      strengths: [],
      improvements: ['Provide a detailed answer to score points.'],
      suggestedAnswer: '',
      band: 'Needs Improvement',
    };
  }

  const hintPenalty = hintsUsed * 5; // -5 pts per hint used
  const typeGuide = {
    behavioral: 'Evaluate using STAR method (Situation, Task, Action, Result). Award "examples" points for concrete stories.',
    technical: 'Evaluate technical accuracy, trade-offs mentioned, edge cases considered.',
    coding: 'Evaluate correctness of algorithm, time/space complexity, code quality, edge cases.',
    system_design: 'Evaluate scalability, component design, database choices, trade-offs, bottleneck identification.',
    hr: 'Evaluate clarity, self-awareness, cultural fit signals.',
  };

  const prompt = `You are a strict but fair technical interviewer evaluating a ${difficulty}-level ${type} interview answer.

QUESTION: ${question}
EXPECTED KEY POINTS: ${(expectedKeyPoints || []).join(', ')}
CANDIDATE ANSWER: ${answer}

Evaluation guide: ${typeGuide[type] || typeGuide.technical}

Score each axis 0-25 (total = 100):
1. correctness (0-25): factual accuracy, right approach
2. depth (0-25): thoroughness, edge cases, trade-offs
3. communication (0-25): clarity, structure, conciseness
4. examples (0-25): concrete examples, stories (STAR for behavioral), code snippets

Hints used: ${hintsUsed} (mentally note this reduces max score by ${hintPenalty} points)

Return ONLY valid JSON (no markdown):
{
  "correctness": number,
  "depth": number,
  "communication": number,
  "examples": number,
  "feedback": "2-3 sentence overall feedback",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "suggestedAnswer": "A model answer or key points the candidate missed (2-3 sentences)"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Evaluation JSON parse failed');

    const parsed = JSON.parse(jsonMatch[0]);
    const rawScore = (parsed.correctness + parsed.depth + parsed.communication + parsed.examples) - hintPenalty;
    const score = Math.max(0, Math.min(100, rawScore));

    const band = score >= 85 ? 'Excellent' : score >= 65 ? 'Good' : score >= 40 ? 'Average' : 'Needs Improvement';

    return { ...parsed, score, band };
  } catch (err) {
    console.error('Gemini evaluateAnswer error, falling back to local evaluation:', err.message);
    return getOfflineEvaluation({ question, answer, type, difficulty, expectedKeyPoints, hintsUsed });
  }
}

// ─── Adaptive Difficulty Engine ───────────────────────────────────────────────

/**
 * Given recent scores, determine next question difficulty.
 * Sliding window of last 2 answers.
 */
function getNextDifficulty(recentScores, currentDifficulty) {
  if (recentScores.length < 2) return currentDifficulty;
  const avg = recentScores.slice(-2).reduce((a, b) => a + b, 0) / 2;
  
  const difficulties = ['easy', 'medium', 'hard'];
  const idx = difficulties.indexOf(currentDifficulty);
  
  if (avg >= 85 && idx < 2) return difficulties[idx + 1]; // go harder
  if (avg < 50 && idx > 0) return difficulties[idx - 1];  // go easier
  return currentDifficulty;
}

// ─── Session Feedback Summary ─────────────────────────────────────────────────

/**
 * Generate a holistic post-interview report with skill radar scores.
 */
async function generateSessionFeedback({ role, level, questions, overallScore }) {
  const qaTranscript = questions.map((q, i) =>
    `Q${i + 1} [${q.type}/${q.difficulty}]: ${q.question}\nAnswer: ${q.answer || 'Skipped'}\nScore: ${q.evaluation?.score ?? 0}/100`
  ).join('\n\n');

  const prompt = `You are a senior engineering manager giving post-interview feedback for a ${level} ${role} candidate.

Overall score: ${overallScore}/100
Interview transcript:
${qaTranscript}

Generate a comprehensive feedback report. Return ONLY valid JSON:
{
  "executiveSummary": "3-4 sentence honest executive summary of the interview performance",
  "topStrengths": ["strength1", "strength2", "strength3"],
  "criticalGaps": ["gap1", "gap2", "gap3"],
  "studyPlan": [
    { "topic": "Topic name", "priority": "high|medium|low", "resources": ["resource1", "resource2"] }
  ],
  "hiringRecommendation": "Strong Hire|Hire|No Hire|Strong No Hire",
  "skillRadar": {
    "problemSolving": number,
    "communication": number,
    "technicalDepth": number,
    "codeQuality": number,
    "systemThinking": number,
    "behavioralFit": number
  }
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Session feedback JSON parse failed');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini generateSessionFeedback error, falling back to local feedback:', err.message);
    return getOfflineSessionFeedback({ role, level, questions, overallScore });
  }
}

// ─── Resume Skill Extractor ───────────────────────────────────────────────────

async function extractSkillsFromResume(resumeText) {
  const prompt = `Extract technical skills, technologies, frameworks, and programming languages from this resume text.
Return ONLY a JSON array of strings, no markdown:
["skill1", "skill2", ...]

Resume:
${resumeText.substring(0, 4000)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini extractSkillsFromResume error, falling back to local list:', err.message);
    return ['JavaScript', 'React', 'Node.js', 'System Design'];
  }
}

// ─── AI Resume Builder ────────────────────────────────────────────────────────

async function buildResumeWithAI(userInput) {
  const prompt = `You are an expert ATS resume writer. Based on the user's background, generate a professional, highly-optimized resume.
USER BACKGROUND: ${userInput}

Return ONLY valid JSON matching this schema exactly (no markdown):
{
  "personal": { "name": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "", "github": "" },
  "summary": "Professional summary...",
  "experience": [
    { "company": "...", "role": "...", "date": "...", "bullets": "• Bullet 1\\n• Bullet 2" }
  ],
  "education": [
    { "school": "...", "degree": "...", "date": "...", "gpa": "..." }
  ],
  "skills": "Skill1, Skill2...",
  "projects": [
    { "name": "...", "desc": "• Bullet 1" }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini buildResumeWithAI error, falling back to local builder:', err.message);
    return {
      personal: { name: "AI Generated Professional", email: "professional@ai.com", phone: "555-0100", location: "San Francisco, CA", linkedin: "linkedin.com/in/ai-gen", github: "github.com/ai-gen" },
      summary: "Highly motivated and results-driven professional generated by AI fallback. Experienced in delivering scalable solutions and optimizing complex systems.",
      experience: [{ company: "MockTech Inc", role: "Senior Developer", date: "2020 - Present", bullets: "• Architected a highly scalable microservices platform.\\n• Improved deployment times by 45% using CI/CD pipelines." }],
      education: [{ school: "University of Tech", degree: "B.S. Computer Science", date: "2016 - 2020", gpa: "3.9" }],
      skills: "JavaScript, React, Node.js, Python, AWS, Docker",
      projects: [{ name: "AI Interview Platform", desc: "• Built a real-time web application using React and Express.\\n• Integrated Google Gemini API for dynamic generation." }]
    };
  }
}

module.exports = {
  generateQuestions,
  evaluateAnswer,
  getNextDifficulty,
  generateSessionFeedback,
  extractSkillsFromResume,
  buildResumeWithAI,
};
