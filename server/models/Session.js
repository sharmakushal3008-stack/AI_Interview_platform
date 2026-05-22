const mongoose = require('mongoose');

const QuestionAnswerSchema = new mongoose.Schema({
  question: String,
  type: { type: String, enum: ['behavioral', 'technical', 'coding', 'system_design', 'hr'] },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  answer: String,
  evaluation: {
    score: Number,           // 0-100
    correctness: Number,     // 0-25
    depth: Number,           // 0-25
    communication: Number,   // 0-25
    examples: Number,        // 0-25
    feedback: String,
    strengths: [String],
    improvements: [String],
    suggestedAnswer: String,
  },
  hintsUsed: { type: Number, default: 0 },
  timeSpent: Number,         // seconds
  skipped: { type: Boolean, default: false },
});

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  role: String,
  level: { type: String, enum: ['junior', 'mid', 'senior', 'lead'] },
  roundType: { type: String, enum: ['behavioral', 'technical', 'coding', 'mixed', 'system_design'] },
  resumeText: String,
  extractedSkills: [String],
  questions: [QuestionAnswerSchema],
  overallScore: Number,
  band: { type: String, enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'] },
  skillRadar: {
    problemSolving: Number,
    communication: Number,
    technicalDepth: Number,
    codeQuality: Number,
    systemThinking: Number,
    behavioralFit: Number,
  },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
});

if (process.env.MONGODB_URI) {
  module.exports = mongoose.model('Session', SessionSchema);
} else {
  // In-memory mock store to ensure 0 errors when running locally without MongoDB
  const store = [];
  class SessionMock {
    constructor(data) {
      Object.assign(this, data);
      this._id = Date.now().toString() + Math.random();
      if (!this.questions) this.questions = [];
      // Mock mongoose subdocument array method
      this.questions.id = (id) => this.questions.find(q => q._id === id || q._id?.toString() === id?.toString());
      this.questions.forEach(q => { if (!q._id) q._id = Date.now().toString() + Math.random().toString(); });
    }
    async save() {
      const idx = store.findIndex(s => s.sessionId === this.sessionId);
      if (idx >= 0) store[idx] = this;
      else store.push(this);
      return this;
    }
    static async findOne(query) {
      const doc = store.find(s => Object.entries(query).every(([k, v]) => s[k] === v));
      return doc || null;
    }
    static find(query) {
      let results = store.filter(s => Object.entries(query).every(([k, v]) => s[k] === v));
      const chain = {
        select: () => chain,
        sort: () => { results.sort((a,b) => (b.completedAt || 0) - (a.completedAt || 0)); return chain; },
        limit: (n) => { results = results.slice(0, n); return chain; },
        then: (resolve) => resolve(results)
      };
      return chain;
    }
  }
  module.exports = SessionMock;
}
