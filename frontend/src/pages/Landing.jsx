import React from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Zap, Database, GitCompare, Upload, Search,
  TrendingUp, ArrowRight, CheckCircle2, AlertTriangle,
  Lock, BarChart2, Cpu
} from 'lucide-react'

const FEATURES = [
  { icon: Search,    title: 'Single Transaction Detection',  desc: 'Enter transaction features and get an instant fraud prediction with confidence score.' },
  { icon: Upload,    title: 'Batch CSV Detection',           desc: 'Upload thousands of transactions at once and download results as CSV.' },
  { icon: BarChart2, title: 'Interactive Dashboard',         desc: 'Real-time statistics, charts, and class distribution from your actual dataset.' },
  { icon: GitCompare,title: 'Model Comparison',              desc: 'Compare Decision Tree, Random Forest, XGBoost and LightGBM side-by-side.' },
  { icon: Database,  title: 'Dataset Explorer',              desc: 'Explore data quality, feature distributions, and class imbalance statistics.' },
  { icon: Cpu,       title: 'ML Algorithm Education',        desc: 'Learn how each classical ML algorithm works with academic explanations.' },
]

const ALGORITHMS = [
  { name: 'Decision Tree',  desc: 'Splits data at feature thresholds to form a tree of rules. Easy to visualize and explain.',       color: '#06b6d4' },
  { name: 'Random Forest',  desc: 'Ensemble of 100 decision trees with majority voting. More accurate, less prone to overfitting.', color: '#7c3aed' },
  { name: 'XGBoost',        desc: 'Gradient boosting: builds trees sequentially, each correcting errors of the previous.',           color: '#f59e0b' },
  { name: 'LightGBM',       desc: 'Fast gradient boosting using histogram-based leaf-wise tree growth.',                             color: '#10b981' },
]

const STEPS = [
  { n: '01', title: 'Load Dataset',         desc: 'Read 284K+ credit card transactions with 30 features (Time, Amount, V1-V28).' },
  { n: '02', title: 'Stratified Split',     desc: 'Split 60/20/20 into train/val/test before ANY preprocessing to prevent leakage.' },
  { n: '03', title: 'Scale Features',       desc: 'Fit StandardScaler on training data only, then transform all three splits.' },
  { n: '04', title: 'Handle Imbalance',     desc: 'Use class_weight="balanced" so the model penalizes missing fraud transactions.' },
  { n: '05', title: 'Train & Evaluate',     desc: 'Train each model and select the best by validation PR-AUC (not accuracy!).' },
  { n: '06', title: 'Final Test Evaluation',desc: 'Evaluate the best model once on the untouched test set for honest results.' },
]

export default function Landing() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
           style={{ background: 'rgba(10,15,30,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-bold gradient-text">FraudShield AI</span>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard" className="text-sm px-4 py-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}>Dashboard</Link>
          <Link to="/detect" className="text-sm px-4 py-2 rounded-lg font-medium text-white"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
            Detect Fraud
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6"
             style={{ background: '#1e1b4b', border: '1px solid #4c1d95', color: '#a78bfa' }}>
          <Zap size={12} /> Classical Machine Learning • No Neural Networks
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          Detect Fraud Before It<br />
          <span className="gradient-text">Becomes a Financial Loss.</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-secondary)' }}>
          An intelligent credit card fraud detection system powered by classical Machine Learning to identify
          suspicious transactions, analyze financial fraud patterns and evaluate model performance.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/dashboard"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
            <BarChart2 size={18} /> Explore Dashboard
          </Link>
          <Link to="/detect"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-transform hover:scale-105"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            <Search size={18} /> Detect Fraud <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">Everything You Need</h2>
          <p className="text-center mb-10" style={{ color: 'var(--text-secondary)' }}>
            A complete fraud detection platform for learning and demonstrating classical ML.
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl p-5 card-glow transition-all"
                   style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                     style={{ background: '#1e1b4b' }}>
                  <f.icon size={18} style={{ color: '#a78bfa' }} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="px-6 pb-20" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-4xl mx-auto py-16">
          <h2 className="text-2xl font-bold text-center mb-3">Fraud Detection Workflow</h2>
          <p className="text-center mb-10" style={{ color: 'var(--text-secondary)' }}>
            How the ML pipeline works — step by step.
          </p>
          <div className="space-y-4">
            {STEPS.map(s => (
              <div key={s.n} className="flex items-start gap-4 p-4 rounded-xl"
                   style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <span className="text-2xl font-black flex-shrink-0 font-mono" style={{ color: '#4c1d95' }}>{s.n}</span>
                <div>
                  <p className="font-semibold mb-0.5">{s.title}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALGORITHMS */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">ML Algorithms Used</h2>
          <p className="text-center mb-10" style={{ color: 'var(--text-secondary)' }}>
            Only classical Machine Learning — no neural networks, no deep learning.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {ALGORITHMS.map(a => (
              <div key={a.name} className="rounded-xl p-5"
                   style={{ background: 'var(--bg-card)', border: `1px solid ${a.color}44` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: a.color }} />
                  <span className="font-semibold">{a.name}</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center rounded-2xl p-10"
             style={{ background: 'linear-gradient(135deg,#1e1b4b,#0f172a)', border: '1px solid #4c1d95' }}>
          <Lock size={40} className="mx-auto mb-4" style={{ color: '#a78bfa' }} />
          <h2 className="text-2xl font-bold mb-3">Ready to Detect Fraud?</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Train models, explore the dataset, and run predictions on real or sample transactions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/dashboard" className="px-5 py-2.5 rounded-lg font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
              Open Dashboard
            </Link>
            <Link to="/detect" className="px-5 py-2.5 rounded-lg font-semibold"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              Try Detection
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-8 px-6" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield size={16} style={{ color: '#7c3aed' }} />
          <span className="font-semibold gradient-text">FraudShield AI</span>
        </div>
        <p className="text-xs">Credit Card Fraud Detection System · Classical Machine Learning · React + FastAPI</p>
        <p className="text-xs mt-1 text-slate-600">Educational project. Not for production financial use.</p>
      </footer>
    </div>
  )
}
