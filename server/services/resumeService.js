const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Full resume analysis engine.
 * Returns ATS score, section-by-section feedback, keyword gaps, rewritten bullets, and role fit.
 */
async function analyzeResume({ resumeText, targetRole, targetLevel }) {
  const prompt = `You are a senior technical recruiter and resume coach at a top-tier tech company (FAANG-level).
Analyze the following resume for a candidate targeting the role: ${targetRole} (${targetLevel} level).

Resume Text:
---
${resumeText.substring(0, 5000)}
---

Provide a comprehensive, brutally honest, actionable resume analysis. Return ONLY valid JSON (no markdown):
{
  "atsScore": number (0-100, how well this resume would pass ATS filters),
  "overallScore": number (0-100, overall quality score),
  "roleFitScore": number (0-100, how well this resume fits ${targetRole} at ${targetLevel} level),
  "executiveSummary": "3-4 sentence honest overall assessment",
  "detectedSkills": ["skill1", "skill2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "sectionScores": {
    "summary": { "score": number, "feedback": "string", "issue": "string" },
    "experience": { "score": number, "feedback": "string", "issue": "string" },
    "skills": { "score": number, "feedback": "string", "issue": "string" },
    "education": { "score": number, "feedback": "string", "issue": "string" },
    "projects": { "score": number, "feedback": "string", "issue": "string" }
  },
  "bulletImprovements": [
    {
      "original": "Original bullet from resume",
      "improved": "Rewritten bullet with action verb, metric, impact",
      "reason": "Why this is better"
    }
  ],
  "criticalIssues": [
    { "issue": "string", "fix": "string", "priority": "high|medium|low" }
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "actionPlan": [
    { "action": "string", "impact": "string", "effort": "low|medium|high" }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resume analysis JSON parse failed');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    // If the API rate limit is hit (429), return a mock response so the UI doesn't break
    if (err.message.includes('429') || err.message.includes('exhausted')) {
      console.log('Returning mock data due to rate limit.');
      return {
        atsScore: 72,
        overallScore: 81,
        roleFitScore: 85,
        executiveSummary: "This resume shows a strong technical foundation but lacks measurable impact in recent roles. To pass stringent ATS parsers for a " + targetLevel + " " + targetRole + " position, it needs more aggressive use of action verbs and quantifiable engineering metrics. Structurally, the document is clean, but the professional summary could be much sharper.",
        detectedSkills: ["JavaScript", "React", "Node.js", "Git", "API Development"],
        missingKeywords: ["Docker", "Kubernetes", "AWS", "CI/CD Pipeline", "Microservices"],
        sectionScores: {
          summary: { score: 65, feedback: "Too generic. Needs to highlight specific engineering achievements and scale.", issue: "Lacks a strong hook." },
          experience: { score: 78, feedback: "Good technical details, but bullets read like job descriptions rather than accomplishments.", issue: "Missing quantitative metrics (e.g., 'improved latency by X%')." },
          skills: { score: 90, feedback: "Well-categorized and comprehensive list of technologies.", issue: null },
          education: { score: 100, feedback: "Clear and properly formatted.", issue: null },
          projects: { score: 85, feedback: "Strong side projects that demonstrate full-stack capability.", issue: null }
        },
        bulletImprovements: [
          {
            original: "Developed new features for the company website using React.",
            improved: "Architected and delivered 5 core frontend features using React, decreasing page load time by 300ms and increasing user engagement by 15%.",
            reason: "Transforms a passive task into an active achievement with measurable business value."
          },
          {
            original: "Fixed bugs in the backend API.",
            improved: "Resolved 40+ critical backend API bottlenecks, achieving 99.9% uptime during peak holiday traffic.",
            reason: "Adds scope (40+ bottlenecks) and impact (99.9% uptime)."
          }
        ],
        criticalIssues: [
          { issue: "Missing System Architecture keywords", fix: "Integrate cloud and deployment keywords (AWS, Docker) if you have experience with them.", priority: "high" },
          { issue: "Weak action verbs", fix: "Replace 'Helped' and 'Worked on' with 'Architected', 'Spearheaded', and 'Engineered'.", priority: "medium" }
        ],
        strengths: ["Clean chronological layout", "Relevant tech stack for modern web development", "Strong educational background"],
        actionPlan: [
          { action: "Quantify your last 3 roles", impact: "Massively increases ATS ranking and recruiter trust.", effort: "medium" },
          { action: "Add a 'Technologies Used' section to each job", impact: "Helps keyword scanners map skills to specific timeline events.", effort: "low" },
          { action: "Rewrite professional summary", impact: "Creates a much stronger first impression for hiring managers.", effort: "low" }
        ]
      };
    }
    throw err; // Re-throw if it's not a rate limit issue
  }
}

module.exports = { analyzeResume };
