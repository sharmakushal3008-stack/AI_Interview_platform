import { Link } from 'react-router-dom';
import { BrainCircuit, Mic, FileText, BarChart3, Lightbulb, Trophy, Target, ShieldCheck, Zap } from 'lucide-react';

const FEATURES = [
  { icon: BrainCircuit, title: 'Adaptive Difficulty', desc: 'Our engine dynamically adjusts question complexity based on your real-time performance.' },
  { icon: Mic, title: 'Zero-Latency Voice', desc: 'Speak your answers naturally. We process speech instantly using optimized browser APIs.' },
  { icon: FileText, title: 'Context-Aware', desc: 'Upload your resume to generate a highly specific interview tailored strictly to your past experience.' },
  { icon: BarChart3, title: 'Multi-Axis Scoring', desc: 'Answers are evaluated on correctness, depth, communication, and real-world examples.' },
  { icon: Lightbulb, title: 'Strategic Hints', desc: 'Stuck on a system design? Request a hint. It costs points, but teaches you the optimal path.' },
  { icon: Trophy, title: 'Actionable Reports', desc: 'Receive a comprehensive post-interview radar chart and a step-by-step personalized study plan.' }
];

export default function LandingPage() {
  return (
    <div className="page">
      {/* Background Ambient Glows */}
      <div className="bg-glow" style={{ top: '-10%', left: '-5%', width: '50vw', height: '50vw', background: 'rgba(59, 130, 246, 0.15)' }} />
      <div className="bg-glow" style={{ bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'rgba(139, 92, 246, 0.12)' }} />

      {/* Hero Section */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '80px', position: 'relative' }}>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            
            <div className="badge badge-brand fade-in" style={{ marginBottom: '24px' }}>
              <Zap size={14} /> AI-Powered Interview Engine 2.0
            </div>
            
            <h1 className="slide-up" style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', marginBottom: '24px' }}>
              Master your next role with <br />
              <span className="text-brand-gradient">clinical precision.</span>
            </h1>
            
            <p className="slide-up slide-up-delay-1" style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
              Stop practicing with generic prompt wrappers. Experience a deterministic, adaptive interview engine that grades you like a senior engineer.
            </p>
            
            <div className="flex justify-center gap-4 slide-up slide-up-delay-2" style={{ flexWrap: 'wrap' }}>
              <Link to="/onboarding" className="btn btn-brand btn-lg">
                Start Mock Interview
              </Link>
              <Link to="/resume" className="btn btn-secondary btn-lg">
                Analyze Resume First
              </Link>
            </div>
            
            {/* Trusted/Metrics Banner */}
            <div className="slide-up slide-up-delay-3 flex justify-center items-center gap-6 mt-8" style={{ marginTop: '64px', borderTop: '1px solid var(--border-subtle)', paddingTop: '32px' }}>
              <div className="flex items-center gap-2 text-text-tertiary">
                <Target size={18} /> <span>4 Evaluative Axes</span>
              </div>
              <div className="flex items-center gap-2 text-text-tertiary">
                <ShieldCheck size={18} /> <span>Bias-Free Scoring</span>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '120px 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div className="text-center mb-8" style={{ maxWidth: '600px', margin: '0 auto 64px auto' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Built for <span className="text-brand-gradient">engineering rigor.</span></h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              We rebuilt the mock interview experience from the ground up, focusing on actionable data rather than conversational fluff.
            </p>
          </div>

          <div className="grid-3">
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="card card-glow" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--gradient-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem' }}>{feat.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '120px 0', position: 'relative' }}>
        <div className="container text-center">
          <div className="card card-elevated" style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 32px', background: 'var(--bg-surface-hover)' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Ready to calibrate your skills?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px auto' }}>
              Upload your resume, select your target architecture, and let the engine assess your baseline.
            </p>
            <Link to="/onboarding" className="btn btn-primary btn-lg">
              Initialize Session
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
