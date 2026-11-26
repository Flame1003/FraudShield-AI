import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Cpu, TrendingUp } from 'lucide-react'
import { api } from '../services/api'
import MetricBar from '../components/MetricBar'

const ALGOS = [
  {
    id: 'decision_tree',
    name: 'Decision Tree',
    color: '#06b6d4',
    emoji: '🌳',
    summary: 'A flowchart-like model that asks yes/no questions about features until it reaches a prediction.',
    what: `A Decision Tree is a supervised learning algorithm that repeatedly splits the data based on feature thresholds.
    Starting from the root node, it asks questions like "Is V14 < -2.5?" and follows the branch that matches the answer,
    until it reaches a leaf node that contains the prediction.`,
    how: `1. Start with the full training set at the root node.
2. For each feature and threshold, calculate the Gini impurity (or information gain).
3. Choose the split that most reduces impurity.
4. Create two child nodes and repeat recursively.
5. Stop when a maximum depth is reached, or when further splits don't improve purity significantly.
6. Each leaf node predicts the majority class of its training samples.`,
    gini: `Gini Impurity = 1 − Σ(pᵢ²)
    
Where pᵢ is the probability of class i in the node. A value of 0 means perfectly pure (all same class). 
A value of 0.5 means perfectly impure (50/50 split). The algorithm always tries to minimize Gini impurity.`,
    pros: ['Easy to interpret and visualize', 'No data scaling required', 'Handles both linear and non-linear boundaries', 'Fast to train and predict'],
    cons: ['Prone to overfitting on training data', 'Sensitive to small variations in data', 'Can create biased trees with imbalanced datasets', 'Single splits may miss complex patterns'],
    fraud: `For fraud detection, a Decision Tree learns patterns like:
"If V14 < -2.1 AND V10 < -3.2 AND Amount < 500 → FRAUD"
These rules are human-readable and can be explained to bank compliance teams.
We used max_depth=12 and class_weight="balanced" to handle the severe class imbalance.`,
    viva: `"A Decision Tree splits data at feature thresholds by minimizing Gini impurity. I set class_weight='balanced' so the model penalizes fraud misclassification more than legitimate misclassification. I also limited max_depth to prevent overfitting."`
  },
  {
    id: 'random_forest',
    name: 'Random Forest',
    color: '#7c3aed',
    emoji: '🌲🌲🌲',
    summary: 'An ensemble of 100 decision trees trained on random subsets of data and features, combined by majority voting.',
    what: `Random Forest is an ensemble learning method that builds many decision trees and combines their predictions.
    Each tree is trained on a different random bootstrap sample of the data, and at each split only a random subset
    of features is considered. This randomness makes the trees diverse and reduces overfitting.`,
    how: `1. Set the number of trees (n_estimators = 100).
2. For each tree:
   a. Bootstrap sample: randomly select N rows with replacement from the training data.
   b. At each node, only consider √(num_features) random features for splitting.
   c. Build a full or limited-depth decision tree on this sample.
3. For prediction: each tree votes on the class. The majority vote wins.
4. For probability: average the fraction of trees predicting each class.`,
    gini: `Same as Decision Tree: Gini Impurity for each split.
Random Forest adds randomness in two ways:
• Row randomness: each tree sees only ~63% of training data (bootstrap).
• Feature randomness: each split considers only √(28) ≈ 5 random features.
These two sources of randomness ensure the trees are decorrelated, which is why averaging them reduces variance.`,
    pros: ['Much less likely to overfit than a single tree', 'Naturally handles feature importance ranking', 'Robust to outliers and noise', 'Works well on imbalanced data with class_weight'],
    cons: ['Less interpretable than a single tree (black box)', 'Slower to train than a single tree', 'Requires more memory', 'Harder to explain individual predictions'],
    fraud: `Random Forest consistently achieves higher fraud recall than a single Decision Tree.
With 100 trees trained on bootstrapped data, it catches fraud patterns that any single tree might miss.
We used n_estimators=100, max_depth=15, class_weight="balanced".
Feature importance from Random Forest reveals which V-features most indicate fraud.`,
    viva: `"Random Forest is an ensemble of 100 decision trees, each trained on a different bootstrap sample with random feature selection at each split. The final prediction is the majority vote. This reduces variance and improves generalization. I used class_weight='balanced' to handle the 0.17% fraud rate."`
  },
  {
    id: 'xgboost',
    name: 'XGBoost',
    color: '#f59e0b',
    emoji: '⚡',
    summary: 'Extreme Gradient Boosting: builds trees sequentially where each tree corrects the errors of the previous one.',
    what: `XGBoost is a boosting algorithm. Unlike Random Forest where trees are built independently in parallel,
    XGBoost builds trees sequentially. Each new tree is specifically trained to predict the residual errors
    of all previous trees, gradually improving the ensemble.`,
    how: `1. Start with a simple prediction (e.g., base score = class prior).
2. Calculate residuals (difference between prediction and actual labels).
3. Train a new tree to predict these residuals.
4. Add the new tree to the ensemble (with a learning rate to avoid overshooting).
5. Recalculate residuals and repeat for n_estimators trees.
6. Final prediction is the sum of all tree outputs.`,
    gini: `XGBoost uses a second-order Taylor expansion to build its trees, which is more efficient than Gini-based splitting.
For class imbalance, we use scale_pos_weight = (negative samples / positive samples) which tells XGBoost
to weight fraud samples proportionally to their rarity.`,
    pros: ['State-of-the-art on tabular data', 'Built-in handling for missing values', 'Regularization prevents overfitting', 'Very fast with parallelization'],
    cons: ['Many hyperparameters to tune', 'More complex than a single tree', 'Still less interpretable than Decision Tree', 'Can overfit on small datasets'],
    fraud: `XGBoost is particularly effective for fraud detection because it focuses on hard-to-classify samples.
Transactions that earlier trees misclassify get higher weight in subsequent trees.
We use scale_pos_weight to handle class imbalance without resampling.`,
    viva: `"XGBoost is a gradient boosting algorithm that builds trees sequentially. Each tree corrects the prediction errors of the previous ensemble. I used scale_pos_weight to handle the class imbalance, which tells the model to treat each fraud sample as if it appeared that many times more."`
  },
  {
    id: 'lightgbm',
    name: 'LightGBM',
    color: '#10b981',
    emoji: '💡',
    summary: 'Fast gradient boosting using histogram-based leaf-wise tree growth for large datasets.',
    what: `LightGBM (Light Gradient Boosting Machine) is Microsoft's implementation of gradient boosting.
    It uses histogram-based algorithms and leaf-wise tree growth (instead of level-wise) to train much faster
    than XGBoost on large datasets while maintaining similar accuracy.`,
    how: `1. Convert continuous features into discrete bins (histograms) — much faster than exact split search.
2. Grow trees leaf-wise: always split the leaf with the highest information gain first.
3. This creates asymmetric trees that can be very deep on one branch but shallow on others.
4. Use gradient-based one-side sampling (GOSS) to focus on samples with large gradients (harder examples).
5. Build sequentially like XGBoost with a learning rate.`,
    gini: `LightGBM uses gradient-based optimization similar to XGBoost but with histogram binning.
class_weight='balanced' applies the same per-class penalty as in scikit-learn models.
Leaf-wise growth allows it to find complex fraud patterns quickly.`,
    pros: ['Significantly faster than XGBoost on large data', 'Lower memory usage', 'High accuracy on tabular data', 'Built-in category feature support'],
    cons: ['Leaf-wise growth can overfit on small datasets', 'Sensitive to hyperparameters', 'Relatively new, less community resources', 'Black box predictions'],
    fraud: `LightGBM's histogram-based approach makes it ideal for the 284K transaction dataset.
It finds non-linear fraud patterns quickly and efficiently.
With leaf-wise growth, it can represent the complex interaction between PCA components V1-V28.`,
    viva: `"LightGBM grows trees leaf-wise instead of level-wise, always choosing the split with the highest gain. It uses histogram binning to speed up computation. It's particularly fast on large tabular datasets like credit card transactions."`
  }
]

export default function Algorithms() {
  const [expanded, setExpanded] = useState('random_forest')
  const [metrics, setMetrics] = useState({})

  useEffect(() => {
    api.compareModels().then(d => {
      const m = {}
      d.models.forEach(mod => { m[mod.id] = mod })
      setMetrics(m)
    }).catch(() => {})
  }, [])

  return (
    <div className="animate-fadein">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text">ML Algorithms</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          How each classical Machine Learning algorithm works for fraud detection.
        </p>
      </div>

      <div className="space-y-4">
        {ALGOS.map(a => {
          const m = metrics[a.id]
          const isOpen = expanded === a.id
          return (
            <div key={a.id} className="rounded-xl overflow-hidden"
                 style={{ background: 'var(--bg-card)', border: `1px solid ${isOpen ? a.color + '55' : 'var(--border)'}` }}>
              {/* Header */}
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-800/30 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : a.id)}>
                <span className="text-2xl">{a.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold">{a.name}</span>
                    {m?.is_best && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1e1b4b', color: '#a78bfa' }}>★ Best Model</span>}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.summary}</p>
                </div>
                {m && (
                  <div className="flex gap-4 mr-4 text-center hidden md:flex">
                    {['recall','f1','pr_auc'].map(k => (
                      <div key={k}>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{k.replace('_','-').toUpperCase()}</p>
                        <p className="text-sm font-bold" style={{ color: a.color }}>{((m[k]??0)*100).toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                )}
                {isOpen ? <ChevronUp size={18} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-secondary)' }} />}
              </button>

              {/* Expanded */}
              {isOpen && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="grid md:grid-cols-2 gap-6 mt-5">
                    <div>
                      <Section title="What is it?" color={a.color}><p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{a.what}</p></Section>
                      <Section title="How does it work?" color={a.color}>
                        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed"
                             style={{ color: 'var(--text-secondary)', background: '#0a0f1e', borderRadius: 8, padding: 12 }}>{a.how}</pre>
                      </Section>
                      <Section title="Splitting Criterion" color={a.color}>
                        <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed"
                             style={{ color: 'var(--text-secondary)', background: '#0a0f1e', borderRadius: 8, padding: 12 }}>{a.gini}</pre>
                      </Section>
                    </div>
                    <div>
                      <Section title="Advantages" color={a.color}>
                        <ul className="space-y-1">{a.pros.map(p => <li key={p} className="text-sm flex gap-2"><span style={{ color: '#10b981' }}>✓</span><span style={{ color: 'var(--text-secondary)' }}>{p}</span></li>)}</ul>
                      </Section>
                      <Section title="Limitations" color={a.color}>
                        <ul className="space-y-1">{a.cons.map(c => <li key={c} className="text-sm flex gap-2"><span style={{ color: '#ef4444' }}>×</span><span style={{ color: 'var(--text-secondary)' }}>{c}</span></li>)}</ul>
                      </Section>
                      <Section title="Fraud Detection Application" color={a.color}>
                        <p className="text-sm whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{a.fraud}</p>
                      </Section>
                      {m && (
                        <Section title="Actual Results (Validation)" color={a.color}>
                          <MetricBar label="Recall"    value={m.recall}    color={a.color} />
                          <MetricBar label="Precision" value={m.precision} color={a.color} />
                          <MetricBar label="F1 Score"  value={m.f1}        color={a.color} />
                          <MetricBar label="PR-AUC"    value={m.pr_auc}    color={a.color} />
                          <MetricBar label="ROC-AUC"   value={m.roc_auc}   color={a.color} />
                        </Section>
                      )}
                      <div className="mt-4 p-3 rounded-lg" style={{ background: '#1e1b4b', border: '1px solid #4c1d95' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: '#a78bfa' }}>📋 VIVA ANSWER</p>
                        <p className="text-xs italic" style={{ color: '#c4b5fd' }}>{a.viva}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color }}>{title}</h4>
      {children}
    </div>
  )
}
