# AI Mock Interview Platform

A full-stack, state-of-the-art AI-powered mock interview platform with adaptive difficulty scaling, voice-to-text integration, multi-axis rubric scoring, resume parsing/customization, and automated feedback loops.

---

## 🚀 What is this project about?

This platform is a comprehensive simulator designed to calibrate software engineering candidates across technical, behavioral, coding, and system design rounds. Instead of generic conversational prompts, it evaluates candidate submissions using a structured engineering rubric and adjusts subsequent questions dynamically.

### Core Pillars
1. **Adaptive Difficulty Engine**: The interview starts with a set difficulty and scales up or down based on a sliding window of recent answer scores (using the `gemini-2.0-flash` model).
2. **Deterministic Multi-Axis Rubric**: Evaluates answers on **Correctness**, **Technical Depth**, **Communication**, and **Practical Examples** (up to 25 points each).
3. **Voice-to-Text Integration**: Supports real-time hands-free speech input using the browser's native Web Speech API.
4. **ATS Resume Suite**:
   - **Resume Analyzer**: Scans uploaded resume PDFs, extracts technical skills, computes ATS scores, highlights missing keywords, suggests critical fixes, and re-writes bullet points using active engineering verbs and metrics.
   - **Resume Builder**: Auto-generates a highly polished, printable A4 resume using simple natural language prompts.
5. **Interactive Telemetry**: Includes a live question progress sequence, a 3-hint budget system (with penalty points), and a post-interview analytics dashboard (with a skill radar chart, study plans, and hiring recommendations).

---

## 🛠️ Tech Stack & End-to-End Status

This application is **fully completed end-to-end** across three layers:

### 1. Data Storage
- **MongoDB Atlas**: Used to persist session metrics, question sequences, history logs, and analytical scores via a Mongoose Schema ([Session.js](file:///c:/Users/HP/Desktop/C/server/models/Session.js)).
- **In-Memory Fallback Store**: If `MONGODB_URI` is omitted from variables, the backend automatically spins up an in-memory database fallback to ensure zero setup overhead for local developers or trial environments.
- **Client Session Storage**: Automatically hydates and persists state across page reloads on the frontend.

### 2. Processing
- **AI Processing (Google Gemini 1.5/2.0)**: Coordinates resume analyzing, dynamic question bank drafting, and answer evaluation (relying on structured JSON generation schemas).
- **PDF Extraction**: Reads uploaded binary PDF buffers on the server using `pdfjs-dist` to extract plain text for parser analysis.
- **Voice STT**: Hooks into native browser voice recognition APIs with silence/error handling.

### 3. Data Showing (Frontend UI)
- Built with **React + Vite** and styled with **Vanilla CSS** for custom glassmorphic styling, animations, and typography (Inter / Outfit).
- Renders responsive dashboards, onboarding sequences, live terminal-like interview buffers, resume layouts, and SVG-based multi-axis telemetry radar charts via **Recharts**.

---

## 💻 Local Setup & Command Scripts

We have configured a root-level `package.json` to manage both environments simultaneously:

### Quick Start

1. **Install all dependencies** (Frontend & Backend):
   ```bash
   npm run setup
   ```

2. **Configure Environment Variables**:
   - In `server/.env` (duplicate from `.env.example`):
     ```env
     GEMINI_API_KEY=your_gemini_api_key
     MONGODB_URI=mongodb+srv://... (optional)
     PORT=5000
     CLIENT_URL=http://localhost:5173
     ```
   - In `client/.env`:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```

3. **Run local servers**:
   - **Run Server**: `npm run dev:server` (Starts Express backend on port `5000`)
   - **Run Client**: `npm run dev:client` (Starts Vite dev server on port `5173`)

---

## 🌐 Deployment Readiness Guide

The codebase is **100% ready for production deployment**. Here is how to launch it:

### Frontend (e.g. Vercel, Netlify)
- **Source Folder**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Set `VITE_API_URL` to your hosted server's URL (e.g. `https://your-server.onrender.com/api`).
- **Routing**: Vite client routing is already pre-configured for Vercel using the provided [vercel.json](file:///c:/Users/HP/Desktop/C/client/vercel.json) rewrite rules.

### Backend (e.g. Render, Railway, Heroku)
- **Source Folder**: `server`
- **Build/Install Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `GEMINI_API_KEY`: Your Google Generative AI API Key.
  - `MONGODB_URI`: Connect to a live MongoDB Atlas cluster for full data persistence.
  - `CLIENT_URL`: Set to the hosted URL of your frontend (e.g. `https://your-app.vercel.app`) to authorize CORS requests.
- **Proxy Config**: Express rate limits have been updated with `app.set('trust proxy', 1)` to handle secure reverse proxies natively in cloud environments.
