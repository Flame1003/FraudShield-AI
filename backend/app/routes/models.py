import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ml"))

from fastapi import APIRouter, HTTPException
from evaluate import get_all_model_metrics, get_roc_curves
from predict import get_available_models

router = APIRouter()


@router.get("/models")
def list_models():
    models = get_available_models()
    if not models:
        raise HTTPException(
            status_code=404,
            detail="No trained models found. Run: python backend/ml/train.py"
        )
    return {"models": models}


@router.get("/models/compare")
def compare_models():
    metrics = get_all_model_metrics()
    curves  = get_roc_curves()
    if not metrics:
        raise HTTPException(status_code=404, detail="No model metrics available.")
    return {"models": metrics, "curves": curves}


@router.get("/models/evaluation")
def model_evaluation():
    metrics = get_all_model_metrics()
    if not metrics:
        raise HTTPException(status_code=404, detail="No evaluation data available.")
    best = next((m for m in metrics if m.get("is_best")), metrics[0])
    return {"best_model": best, "all_models": metrics}
