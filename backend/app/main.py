"""
FraudShield AI — FastAPI Backend
"""

import sys
import os

# Allow importing from ml/ directory
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ml"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import dataset, models, predict

app = FastAPI(
    title="FraudShield AI",
    description="Credit Card Fraud Detection API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Allow React frontend on port 5173 (Vite default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset.router, prefix="/api")
app.include_router(models.router,  prefix="/api")
app.include_router(predict.router,  prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "FraudShield AI"}
