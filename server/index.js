require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const sessionRoutes = require('./routes/session');
const interviewRoutes = require('./routes/interview');
const resumeRoutes = require('./routes/resume');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://client-peach-pi-60.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin);
    const isVercel = origin.endsWith('.vercel.app');
    if (isAllowed || isVercel) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limit: 120 req / 15 min per IP
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120, message: { error: 'Too many requests, please try again later.' } });
// AI-heavy endpoint limit: 15 req / 15 min per IP
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: { error: 'AI request limit reached. Please wait before trying again.' } });

app.use(globalLimiter);

// Routes
app.use('/api/session', aiLimiter, sessionRoutes);
app.use('/api/interview', aiLimiter, interviewRoutes);
app.use('/api/resume', aiLimiter, resumeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// MongoDB connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
    } else {
      console.warn('⚠️  MONGODB_URI not set — running without persistence');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
};

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 InterviewAI server running on http://localhost:${PORT}`);
    });
  });
} else {
  connectDB();
}

module.exports = app;
