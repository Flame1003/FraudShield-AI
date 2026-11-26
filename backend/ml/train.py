"""
train.py — Train Decision Tree, Random Forest, XGBoost, LightGBM
-----------------------------------------------------------------
WHAT THIS DOES:
  1. Loads and preprocesses data.
  2. Trains 4 models with class_weight='balanced' (handles class imbalance).
  3. Evaluates each on the VALIDATION set (not test).
  4. Saves every trained model to backend/ml/models/.
  5. Saves a training_results.json with all metrics.

WHY class_weight='balanced'?
  Fraud is ~0.17% of data. Without balancing, the model learns to always
  predict "legitimate" and achieves 99.83% accuracy but catches no fraud.
  Setting class_weight='balanced' makes the model penalize fraud misses more.

VIVA TIP:
  "I used balanced class weights instead of SMOTE to avoid data leakage —
   SMOTE should only be applied inside the training fold, never before splitting."
"""

import os
import json
import numpy as np
import joblib
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

try:
    from lightgbm import LGBMClassifier
    HAS_LGB = True
except ImportError:
    HAS_LGB = False

from preprocessing import prepare_data

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
RESULTS_PATH = os.path.join(MODELS_DIR, "training_results.json")
RANDOM_SEED = 42


def evaluate(model, X, y, threshold=0.5):
    """Compute all classification metrics."""
    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)[:, 1]
        y_pred = (proba >= threshold).astype(int)
        roc = float(roc_auc_score(y, proba))
        pr_auc = float(average_precision_score(y, proba))
    else:
        y_pred = model.predict(X)
        proba = y_pred.astype(float)
        roc = float(roc_auc_score(y, proba))
        pr_auc = float(average_precision_score(y, proba))

    cm = confusion_matrix(y, y_pred)
    tn, fp, fn, tp = cm.ravel()

    return {
        "accuracy":  float(accuracy_score(y, y_pred)),
        "precision": float(precision_score(y, y_pred, zero_division=0)),
        "recall":    float(recall_score(y, y_pred, zero_division=0)),
        "f1":        float(f1_score(y, y_pred, zero_division=0)),
        "roc_auc":   roc,
        "pr_auc":    pr_auc,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "threshold": threshold,
    }


def find_best_threshold(model, X_val, y_val):
    """Find the threshold that maximises F1 on validation data."""
    if not hasattr(model, "predict_proba"):
        return 0.5
    proba = model.predict_proba(X_val)[:, 1]
    thresholds = np.linspace(0.01, 0.99, 99)
    best_t, best_f1 = 0.5, 0.0
    for t in thresholds:
        pred = (proba >= t).astype(int)
        f1 = f1_score(y_val, pred, zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_t = float(t)
    return best_t


def train_all():
    os.makedirs(MODELS_DIR, exist_ok=True)

    X_train, X_val, X_test, y_train, y_val, y_test, feature_cols = prepare_data()

    models_config = {
        "decision_tree": DecisionTreeClassifier(
            class_weight="balanced",
            max_depth=12,
            min_samples_leaf=5,
            random_state=RANDOM_SEED,
        ),
        "random_forest": RandomForestClassifier(
            class_weight="balanced",
            n_estimators=100,
            max_depth=15,
            min_samples_leaf=5,
            n_jobs=-1,
            random_state=RANDOM_SEED,
        ),
    }

    if HAS_XGB:
        ratio = int((y_train == 0).sum() / max((y_train == 1).sum(), 1))
        models_config["xgboost"] = XGBClassifier(
            scale_pos_weight=ratio,
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=RANDOM_SEED,
            verbosity=0,
        )

    if HAS_LGB:
        models_config["lightgbm"] = LGBMClassifier(
            class_weight="balanced",
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=RANDOM_SEED,
            verbose=-1,
        )

    results = {}
    best_model_name = None
    best_pr_auc = -1.0

    for name, model in models_config.items():
        print(f"\n[train] Training {name}...")
        model.fit(X_train, y_train)

        threshold = find_best_threshold(model, X_val, y_val)
        val_metrics   = evaluate(model, X_val, y_val, threshold)
        train_metrics = evaluate(model, X_train, y_train, threshold)

        print(f"  Val  → Recall={val_metrics['recall']:.4f}  PR-AUC={val_metrics['pr_auc']:.4f}  F1={val_metrics['f1']:.4f}")

        # Save model
        model_path = os.path.join(MODELS_DIR, f"{name}.pkl")
        joblib.dump(model, model_path)
        print(f"  Saved → {model_path}")

        results[name] = {
            "name": name,
            "display_name": name.replace("_", " ").title(),
            "val_metrics": val_metrics,
            "train_metrics": train_metrics,
            "threshold": threshold,
            "model_path": model_path,
        }

        if val_metrics["pr_auc"] > best_pr_auc:
            best_pr_auc = val_metrics["pr_auc"]
            best_model_name = name

    # --- Final evaluation of best model on UNTOUCHED test set ---
    print(f"\n[train] Best model (by val PR-AUC): {best_model_name}")
    best_model = joblib.load(os.path.join(MODELS_DIR, f"{best_model_name}.pkl"))
    best_threshold = results[best_model_name]["threshold"]
    test_metrics = evaluate(best_model, X_test, y_test, best_threshold)
    print(f"  Test → Recall={test_metrics['recall']:.4f}  PR-AUC={test_metrics['pr_auc']:.4f}  F1={test_metrics['f1']:.4f}")

    results[best_model_name]["test_metrics"] = test_metrics
    results[best_model_name]["is_best"] = True

    summary = {
        "best_model": best_model_name,
        "feature_columns": feature_cols,
        "models": results,
        "dataset_stats": {
            "train_size": int(len(y_train)),
            "val_size": int(len(y_val)),
            "test_size": int(len(y_test)),
            "train_fraud": int(y_train.sum()),
            "val_fraud": int(y_val.sum()),
            "test_fraud": int(y_test.sum()),
        }
    }

    with open(RESULTS_PATH, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\n[train] Results saved → {RESULTS_PATH}")

    return summary


if __name__ == "__main__":
    train_all()
