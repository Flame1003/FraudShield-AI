import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "ml"))

import io
import json
import csv as csv_module
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from app.schemas.schemas import TransactionFeatures, PredictResponse
import predict as pred_module

router = APIRouter()

MAX_BATCH_ROWS = 10_000
MAX_FILE_BYTES = 20 * 1024 * 1024  # 20 MB


@router.post("/predict", response_model=PredictResponse)
def predict_single(tx: TransactionFeatures):
    try:
        features = tx.model_dump(exclude={"model_name"})
        result = pred_module.predict_single(features, tx.model_name)
        return result
    except (RuntimeError, FileNotFoundError) as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/predict/batch")
async def predict_batch(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form(None),
):
    # --- Validate file type ---
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum 20 MB.")

    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded.")

    reader = csv_module.DictReader(io.StringIO(text))
    rows_raw = list(reader)

    if len(rows_raw) == 0:
        raise HTTPException(status_code=400, detail="CSV file is empty.")

    if len(rows_raw) > MAX_BATCH_ROWS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_BATCH_ROWS} rows allowed.")

    # --- Convert to float dicts, track invalid rows ---
    rows, errors = [], []
    for i, row in enumerate(rows_raw):
        converted = {}
        row_errors = []
        for k, v in row.items():
            try:
                converted[k] = float(v) if v not in (None, "") else 0.0
            except ValueError:
                row_errors.append(f"Column '{k}' has non-numeric value '{v}'")
        if row_errors:
            errors.append({"row": i + 1, "errors": row_errors})
        else:
            rows.append(converted)

    if len(rows) == 0:
        raise HTTPException(status_code=400, detail=f"No valid rows. Errors: {errors[:5]}")

    try:
        predictions = pred_module.predict_batch(rows, model_name)
    except (RuntimeError, FileNotFoundError) as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Merge original row data with predictions for download
    output_rows = []
    for i, (orig, pred_res) in enumerate(zip(rows, predictions)):
        output_rows.append({
            **orig,
            "prediction": pred_res["prediction"],
            "label": pred_res["label"],
            "fraud_probability": pred_res["fraud_probability"],
        })

    n_fraud = sum(1 for p in predictions if p["prediction"] == 1)

    return {
        "total": len(rows),
        "fraudulent": n_fraud,
        "legitimate": len(rows) - n_fraud,
        "skipped_invalid_rows": len(errors),
        "parse_errors": errors[:20],
        "predictions": predictions[:500],  # Return first 500 for display
        "model_used": predictions[0]["model_used"] if predictions else model_name,
        "results_csv": _to_csv_string(output_rows),
    }


def _to_csv_string(rows: list) -> str:
    if not rows:
        return ""
    buf = io.StringIO()
    writer = csv_module.DictWriter(buf, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


@router.get("/predict/sample")
def get_sample_transactions():
    """Return a few sample transactions from the dataset for testing."""
    import pandas as pd
    from preprocessing import DATASET_PATH, FEATURES_PATH
    import joblib

    if not os.path.exists(DATASET_PATH):
        raise HTTPException(status_code=404, detail="Dataset not available.")

    df = pd.read_csv(DATASET_PATH, nrows=5000)
    feat_cols = joblib.load(FEATURES_PATH) if os.path.exists(FEATURES_PATH) else [
        c for c in df.columns if c != "Class"
    ]

    # Get 3 legit + 2 fraud
    legit  = df[df["Class"] == 0][feat_cols].head(3).to_dict(orient="records")
    frauds = df[df["Class"] == 1][feat_cols].head(2).to_dict(orient="records")

    samples = [{"label": "LEGITIMATE", **r} for r in legit] + \
              [{"label": "FRAUD",      **r} for r in frauds]
    return {"samples": samples}
