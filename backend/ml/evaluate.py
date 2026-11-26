"""
evaluate.py — Load saved results and compute chart-ready data
--------------------------------------------------------------
Used by the backend API to serve evaluation metrics and chart data.
Never retrains or refits anything.
"""

import os
import json
import numpy as np
import joblib
import pandas as pd
from sklearn.metrics import roc_curve, precision_recall_curve

MODELS_DIR   = os.path.join(os.path.dirname(__file__), "models")
RESULTS_PATH = os.path.join(MODELS_DIR, "training_results.json")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "data", "creditcard.csv")
SCALER_PATH  = os.path.join(MODELS_DIR, "scaler.pkl")
FEATURES_PATH = os.path.join(MODELS_DIR, "feature_names.pkl")

_cache = {}


def _results():
    if not os.path.exists(RESULTS_PATH):
        return None
    with open(RESULTS_PATH) as f:
        return json.load(f)


def get_all_model_metrics():
    r = _results()
    if r is None:
        return []
    out = []
    for name, info in r["models"].items():
        vm = info.get("val_metrics", {})
        out.append({
            "id": name,
            "display_name": info["display_name"],
            "is_best": info.get("is_best", False),
            "accuracy":  vm.get("accuracy"),
            "precision": vm.get("precision"),
            "recall":    vm.get("recall"),
            "f1":        vm.get("f1"),
            "roc_auc":   vm.get("roc_auc"),
            "pr_auc":    vm.get("pr_auc"),
            "confusion_matrix": vm.get("confusion_matrix"),
            "threshold": info.get("threshold", 0.5),
        })
    return out


def get_dataset_stats():
    if not os.path.exists(DATASET_PATH):
        return None
    if "ds_stats" in _cache:
        return _cache["ds_stats"]

    df = pd.read_csv(DATASET_PATH)
    n_total  = len(df)
    n_fraud  = int(df["Class"].sum())
    n_legit  = n_total - n_fraud
    desc     = df.describe().to_dict()
    amount_hist = df["Amount"].clip(upper=5000)
    hist, edges = np.histogram(amount_hist, bins=30)

    stats = {
        "total": n_total,
        "legitimate": n_legit,
        "fraudulent": n_fraud,
        "fraud_pct": round(n_fraud / n_total * 100, 4),
        "features": [c for c in df.columns if c != "Class"],
        "num_features": len(df.columns) - 1,
        "has_missing": int(df.isnull().sum().sum()),
        "has_duplicates": int(df.duplicated().sum()),
        "amount_hist": {
            "counts": hist.tolist(),
            "bin_edges": [round(x, 2) for x in edges.tolist()],
        },
        "amount_stats": {
            "min":    round(float(df["Amount"].min()), 2),
            "max":    round(float(df["Amount"].max()), 2),
            "mean":   round(float(df["Amount"].mean()), 2),
            "median": round(float(df["Amount"].median()), 2),
            "std":    round(float(df["Amount"].std()), 2),
        },
        "fraud_amount_stats": {
            "min":    round(float(df[df["Class"]==1]["Amount"].min()), 2),
            "max":    round(float(df[df["Class"]==1]["Amount"].max()), 2),
            "mean":   round(float(df[df["Class"]==1]["Amount"].mean()), 2),
            "median": round(float(df[df["Class"]==1]["Amount"].median()), 2),
        },
    }
    _cache["ds_stats"] = stats
    return stats


def get_roc_curves():
    """Compute ROC curve data for each model on saved val probabilities."""
    r = _results()
    if r is None or not os.path.exists(SCALER_PATH):
        return []
    # We re-evaluate on the full dataset's val split to get curve points
    # (expensive once, cached)
    if "roc_curves" in _cache:
        return _cache["roc_curves"]

    from preprocessing import prepare_data
    try:
        _, X_val, _, _, y_val, _, _ = prepare_data()
    except Exception:
        return []

    out = []
    for name in r["models"]:
        path = os.path.join(MODELS_DIR, f"{name}.pkl")
        if not os.path.exists(path):
            continue
        model = joblib.load(path)
        if not hasattr(model, "predict_proba"):
            continue
        proba = model.predict_proba(X_val)[:, 1]
        fpr, tpr, _ = roc_curve(y_val, proba)
        prec, rec, _ = precision_recall_curve(y_val, proba)
        out.append({
            "model": name,
            "display_name": r["models"][name]["display_name"],
            "roc": {"fpr": fpr[::10].tolist(), "tpr": tpr[::10].tolist()},
            "prc": {"precision": prec[::10].tolist(), "recall": rec[::10].tolist()},
        })
    _cache["roc_curves"] = out
    return out
