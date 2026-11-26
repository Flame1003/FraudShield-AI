from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class TransactionFeatures(BaseModel):
    Time: float = Field(0.0, description="Seconds elapsed since first transaction")
    Amount: float = Field(..., gt=0, description="Transaction amount in USD")
    V1: float = 0.0
    V2: float = 0.0
    V3: float = 0.0
    V4: float = 0.0
    V5: float = 0.0
    V6: float = 0.0
    V7: float = 0.0
    V8: float = 0.0
    V9: float = 0.0
    V10: float = 0.0
    V11: float = 0.0
    V12: float = 0.0
    V13: float = 0.0
    V14: float = 0.0
    V15: float = 0.0
    V16: float = 0.0
    V17: float = 0.0
    V18: float = 0.0
    V19: float = 0.0
    V20: float = 0.0
    V21: float = 0.0
    V22: float = 0.0
    V23: float = 0.0
    V24: float = 0.0
    V25: float = 0.0
    V26: float = 0.0
    V27: float = 0.0
    V28: float = 0.0
    model_name: Optional[str] = None


class PredictResponse(BaseModel):
    prediction: int
    label: str
    fraud_probability: float
    threshold: float
    model_used: str
    display_name: str


class BatchPredictRequest(BaseModel):
    model_name: Optional[str] = None


class MetricSet(BaseModel):
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1: Optional[float]
    roc_auc: Optional[float]
    pr_auc: Optional[float]
    confusion_matrix: Optional[Dict[str, int]]
    threshold: Optional[float]


class ModelInfo(BaseModel):
    id: str
    display_name: str
    is_best: bool
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1: Optional[float]
    roc_auc: Optional[float]
    pr_auc: Optional[float]
    confusion_matrix: Optional[Dict[str, int]]
    threshold: Optional[float]
