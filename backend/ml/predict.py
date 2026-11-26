"""
predict.py — Inference module
------------------------------
Loads a trained model from disk and runs predictions.
Never trains models at inference time.
"""

import os
import json
import numpy as np
import joblib

MODELS_DIR    = os.path.join(os.path.dirname(__file__), "models")
RESULTS_PATH  = os.path.join(MODELS_DIR, "training_results.json")
SCALER_PATH   = os.path.join(MODELS_DIR, "scaler.pkl")
FEATURES_PATH = os.path.join(MODELS_DIR, "feature_names.pkl")

_cache = {}  # In-memory model cache to avoid repeated disk reads


def _load_results() -> dict:
    if not os.path.exists(RESULTS_PATH):
        raise RuntimeError(
            "Models not trained yet. Run:  python backend/ml/train.py"
        )
    with open(RESULTS_PATH) as f:
        return json.load(f)


def _load_model(name: str):
    if name not in _cache:
        path = os.path.join(MODELS_DIR, f"{name}.pkl")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        _cache[name] = joblib.load(path)
    return _cache[name]


def _load_scaler():
    if "scaler" not in _cache:
        _cache["scaler"] = joblib.load(SCALER_PATH)
    return _cache["scaler"]


def _load_features():
    if "features" not in _cache:
        _cache["features"] = joblib.load(FEATURES_PATH)
    return _cache["features"]


def get_available_models() -> list:
    if not os.path.exists(RESULTS_PATH):
        return []
    results = _load_results()
    models = []
    for name, info in results["models"].items():
        models.append({
            "id": name,
            "display_name": info["display_name"],
            "is_best": info.get("is_best", False),
            "threshold": info.get("threshold", 0.5),
            "val_metrics": info.get("val_metrics", {}),
        })
    return models


def predict_single(features: dict, model_name: str = None) -> dict:
    """
    Predict fraud for one transaction.
    Returns prediction, probability, model name, and threshold.
    """
    results   = _load_results()
    if model_name is None:
        model_name = results["best_model"]

    if model_name not in results["models"]:
        raise ValueError(f"Unknown model: {model_name}. Available: {list(results['models'].keys())}")

    threshold = results["models"][model_name].get("threshold", 0.5)
    model     = _load_model(model_name)
    scaler    = _load_scaler()
    feat_cols = _load_features()

    row = np.array([[features.get(f, 0.0) for f in feat_cols]])
    row_scaled = scaler.transform(row)

    if hasattr(model, "predict_proba"):
        proba = float(model.predict_proba(row_scaled)[0, 1])
    else:
        proba = float(model.predict(row_scaled)[0])

    pred = int(proba >= threshold)

    return {
        "prediction": pred,
        "label":      "FRAUD" if pred == 1 else "LEGITIMATE",
        "fraud_probability": round(proba, 6),
        "threshold": threshold,
        "model_used": model_name,
        "display_name": results["models"][model_name]["display_name"],
    }


def predict_batch(rows: list, model_name: str = None) -> list:
    """
    Predict fraud for a list of feature dicts.
    Returns list of prediction results.
    """
    results   = _load_results()
    if model_name is None:
        model_name = results["best_model"]

    threshold = results["models"][model_name].get("threshold", 0.5)
    model     = _load_model(model_name)
    scaler    = _load_scaler()
    feat_cols = _load_features()

    import numpy as np
    matrix = np.array([[r.get(f, 0.0) for f in feat_cols] for r in rows])
    matrix_scaled = scaler.transform(matrix)

    if hasattr(model, "predict_proba"):
        probas = model.predict_proba(matrix_scaled)[:, 1].tolist()
    else:
        probas = model.predict(matrix_scaled).astype(float).tolist()

    predictions = []
    for i, proba in enumerate(probas):
        pred = int(proba >= threshold)
        predictions.append({
            "row_index": i,
            "prediction": pred,
            "label": "FRAUD" if pred == 1 else "LEGITIMATE",
            "fraud_probability": round(proba, 6),
            "threshold": threshold,
            "model_used": model_name,
        })
    return predictions
