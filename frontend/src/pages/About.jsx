import React from 'react'
import { Shield, Database, Cpu, Code2, BookOpen, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react'

const TECH = [
  { label: 'Frontend',          items: ['React.js', 'Vite', 'JavaScript', 'Tailwind CSS', 'Recharts', 'Lucide React', 'React Router'] },
  { label: 'Backend',           items: ['Python 3.10', 'FastAPI', 'Pydantic', 'Uvicorn'] },
  { label: 'Machine Learning',  items: ['Scikit-learn', 'Pandas', 'NumPy', 'Imbalanced-learn', 'XGBoost', 'LightGBM', 'Joblib', 'Matplotlib', 'Seaborn'] },
  { label: 'Storage',           items: ['Joblib (model files)', 'JSON (metrics)', 'CSV (dataset)', 'SQLite (optional)'] },
]

const PHASES = [
  { n: 1,  title: 'Dataset Inspection',         desc: 'Load and validate the credit card transaction dataset, check schema and class distribution.' },
  { n: 2,  title: 'Data Preprocessing',         desc: 'Remove duplicates, handle missing values, stratified train/val/test split 60/20/20, StandardScaler fitted only on training data.' },
  { n: 3,  title: 'Baseline Model Training',    desc: 'Train Decision Tree and Random Forest without any class imbalance handling to establish baselines.' },
  { n: 4,  title: 'Class Imbalance Handling',   desc: 'Retrain with class_weight="balanced". Compare baseline vs balanced models on validation PR-AUC.' },
  { n: 5,  title: 'Extended Training',          desc: 'Train XGBoost and LightGBM with appropriate imbalance handling (scale_pos_weight / class_weight).' },
  { n: 6,  title: 'Threshold Optimization',     desc: 'Find the prediction threshold that maximizes F1 score on validation data for each model.' },
  { n: 7,  title: 'Model Selection',            desc: 'Select the best model by validation PR-AUC. Evaluate it once on the untouched test set.' },
  { n: 8,  title: 'Model Saving & API',         desc: 'Serialize model and scaler with Joblib. Build FastAPI with endpoints for health, stats, single/batch prediction.' },
  { n: 9,  title: 'Frontend Development',       desc: 'Build React SPA with 8 pages: Landing, Dashboard, Detection, Batch, Algorithms, Comparison, Explorer, About.' },
  { n: 10, title: 'Integration & Testing',      desc: 'Connect frontend to backend, verify all endpoints, test prediction flow, batch upload, CSV download.' },
]

const METRICS_EXPLAINED = [
  { metric: 'Accuracy',   desc: 'Fraction of all predictions that are correct. Misleading for imbalanced data.' },
  { metric: 'Precision',  desc: 'Of all predicted frauds, how many are actually fraud? High precision = few false alarms.' },
  { metric: 'Recall',     desc: 'Of all actual frauds, how many did we catch? High recall = few missed frauds. The most important metric here.' },
  { metric: 'F1 Score',   desc: 'Harmonic mean of Precision and Recall. Balances the trade-off between the two.' },
  { metric: 'ROC-AUC',    desc: 'Area under the ROC curve. Measures ranking quality across all thresholds.' },
  { metric: 'PR-AUC',     desc: 'Area under the Precision-Recall curve. Best metric for imbalanced binary classification.' },
]

const LIMITATIONS = [
  'The synthetic dataset mimics the real one but is not identical. Replace with Kaggle data for real-world results.',
  'Models are not updated continuously. Fraud patterns change over time — periodic retraining is required in production.',
  'V1–V28 are anonymous PCA features. The model cannot explain which original financial features triggered fraud.',
  'No customer behavioral analysis (transaction history, velocity, geolocation) is included.',
  'The 0.5 or optimized threshold is fixed. Dynamic threshold selection per risk context is not implemented.',
  'Batch predictions are limited to 10,000 rows per upload in this educational version.',
]

const IMPROVEMENTS = [
  'Replace synthetic data with the real Kaggle credit card dataset for accurate metrics.',
  'Add SHAP values for model explainability — show which V-features contributed to each prediction.',
  'Implement real-time streaming predictions using WebSockets.',
  'Add model drift detection: automatically flag when fraud patterns change.',
  'Add user authentication and role-based access control for multi-user deployment.',
  'Implement SMOTE inside a cross-validation pipeline for a fair comparison with class weighting.',
  'Build a model retraining pipeline that automatically retrains when new labeled data arrives.',
]

export default function About() {
  return (
    <div className="animate-fadein max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">About & Methodology</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Complete academic overview of the FraudShield AI project.
        </p>
      </div>

      {/* Identity */}
      <div className="rounded-xl p-5 mb-5 flex gap-4"
           style={{ background: 'linear-gradient(135deg,#1e1b4b,#0f172a)', border: '1px solid #4c1d95' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#c4b5fd' }}>FraudShield AI</h2>
          <p className="text-sm mb-1" style={{ color: '#94a3b8' }}>Credit Card Fraud Detection System</p>
          <p className="text-xs italic" style={{ color: '#64748b' }}>"Detect Fraud Before It Becomes a Financial Loss."</p>
        </div>
      </div>

      <Section icon={BookOpen} title="Problem Statement" color="#3b82f6">
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Credit card fraud causes billions of dollars in losses annually. Financial institutions must identify
          fraudulent transactions within milliseconds while minimizing false positives that inconvenience legitimate customers.
        </p>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          The core challenge is <strong className="text-blue-400">extreme class imbalance</strong>: approximately
          0.17% of transactions are fraudulent. Standard ML models trained without addressing this imbalance learn
          to predict "Legitimate" for everything and achieve 99.83% accuracy while catching zero fraud.
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This project demonstrates how classical ML algorithms with appropriate class weighting can effectively
          identify fraud while maintaining an acceptable false positive rate.
        </p>
      </Section>

      <Section icon={Database} title="Dataset" color="#06b6d4">
        <ul className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
          <li>• <strong className="text-cyan-400">Source:</strong> European Credit Card Fraud Dataset (Kaggle / Zenodo)</li>
          <li>• <strong className="text-cyan-400">Records:</strong> 284,807 transactions (2 days in September 2013)</li>
          <li>• <strong className="text-cyan-400">Features:</strong> Time, V1–V28 (PCA-transformed), Amount, Class</li>
          <li>• <strong className="text-cyan-400">Target:</strong> Class (0 = Legitimate, 1 = Fraudulent)</li>
          <li>• <strong className="text-cyan-400">Imbalance:</strong> 492 fraudulent transactions (0.172%)</li>
          <li>• <strong className="text-cyan-400">Privacy:</strong> V1–V28 are anonymized via PCA to protect cardholder identity</li>
        </ul>
      </Section>

      <Section icon={Cpu} title="ML Methodology" color="#7c3aed">
        <div className="space-y-4">
          {PHASES.map(p => (
            <div key={p.n} className="flex gap-3">
              <span className="font-black text-lg font-mono flex-shrink-0 w-7" style={{ color: '#4c1d95' }}>{String(p.n).padStart(2,'0')}</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{p.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={TrendingUp} title="Evaluation Metrics Explained" color="#10b981">
        <div className="space-y-3">
          {METRICS_EXPLAINED.map(m => (
            <div key={m.metric} className="p-3 rounded-lg" style={{ background: '#0a0f1e', border: '1px solid var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: '#10b981' }}>{m.metric}</span>
              <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>{m.desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-lg" style={{ background: '#1e1b4b', border: '1px solid #4c1d95' }}>
          <p className="text-xs" style={{ color: '#c4b5fd' }}>
            <strong>Model Selection Rule:</strong> The best model is chosen by highest validation PR-AUC,
            not accuracy. High PR-AUC means the model correctly identifies fraud at a range of thresholds.
          </p>
        </div>
      </Section>

      <Section icon={Code2} title="Technology Stack" color="#f59e0b">
        <div className="grid md:grid-cols-2 gap-4">
          {TECH.map(t => (
            <div key={t.label} className="p-3 rounded-lg" style={{ background: '#0a0f1e', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>{t.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {t.items.map(i => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: '#1e293b', color: '#94a3b8' }}>{i}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={AlertTriangle} title="Known Limitations" color="#ef4444">
        <ul className="space-y-2">
          {LIMITATIONS.map((l, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span style={{ color: '#ef4444' }} className="flex-shrink-0">•</span>
              <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={CheckCircle2} title="Future Improvements" color="#06b6d4">
        <ul className="space-y-2">
          {IMPROVEMENTS.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span style={{ color: '#06b6d4' }} className="flex-shrink-0">→</span>
              <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: `${color}22` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}
