import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ml"))

from fastapi import APIRouter, HTTPException
from evaluate import get_dataset_stats

router = APIRouter()


@router.get("/dataset/overview")
def dataset_overview():
    stats = get_dataset_stats()
    if stats is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found. Run: python backend/ml/generate_dataset.py"
        )
    return stats


@router.get("/dashboard/stats")
def dashboard_stats():
    import json, os as _os
    stats = get_dataset_stats()
    if stats is None:
        return {
            "total": 0,
            "legitimate": 0,
            "fraudulent": 0,
            "fraud_pct": 0,
            "dataset_ready": False,
        }
    
    results_path = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "models", "training_results.json")
    r = {}
    if _os.path.exists(results_path):
        with open(results_path) as f:
            r = json.load(f)
    
    return {
        **stats,
        "dataset_ready": True,
        "models_trained": list(r.get("models", {}).keys()),
        "best_model": r.get("best_model", "N/A"),
    }
