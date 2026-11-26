"""
preprocessing.py — Feature engineering and train/test splitting
----------------------------------------------------------------
WHAT THIS MODULE DOES:
  1. Loads the CSV dataset.
  2. Validates the schema.
  3. Splits into train / validation / test (60/20/20) BEFORE any fitting.
     → This prevents data leakage: the scaler never sees val/test data.
  4. Fits a StandardScaler ONLY on training data, then transforms all splits.
  5. Returns ready-to-use numpy arrays.

WHY SPLIT BEFORE SCALING?
  If you scale the whole dataset first, the scaler learns statistics from the
  test set, which leaks information. Always: split → fit on train → transform all.

VIVA TIP:
  "I used stratified splitting to preserve the fraud ratio in every split,
   then applied StandardScaler fitted only on training data."
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

DATASET_PATH = os.path.join(os.path.dirname(__file__), "data", "creditcard.csv")
SCALER_PATH  = os.path.join(os.path.dirname(__file__), "models", "scaler.pkl")
FEATURES_PATH = os.path.join(os.path.dirname(__file__), "models", "feature_names.pkl")

RANDOM_SEED = 42
REQUIRED_COLS = ["Time", "Amount", "Class"] + [f"V{i}" for i in range(1, 29)]


def load_dataset(path: str = DATASET_PATH) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Dataset not found at: {path}\n"
            "Run:  python backend/ml/generate_dataset.py\n"
            "OR download the real dataset from:\n"
            "  https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud\n"
            "and place creditcard.csv in backend/ml/data/"
        )
    df = pd.read_csv(path)
    return df


def validate_schema(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset missing columns: {missing}")
    if df["Class"].nunique() < 2:
        raise ValueError("Dataset must contain both class 0 and class 1.")


def get_feature_columns(df: pd.DataFrame) -> list:
    """Return feature columns (everything except Class)."""
    return [c for c in df.columns if c != "Class"]


def prepare_data(path: str = DATASET_PATH):
    """
    Full preprocessing pipeline.
    Returns:
        X_train, X_val, X_test, y_train, y_val, y_test, feature_names
    """
    df = load_dataset(path)
    validate_schema(df)

    # Drop duplicates
    before = len(df)
    df = df.drop_duplicates()
    after = len(df)
    if before != after:
        print(f"[preprocessing] Removed {before - after} duplicate rows.")

    # Drop rows with missing values
    df = df.dropna()

    feature_cols = get_feature_columns(df)
    X = df[feature_cols].values
    y = df["Class"].values

    # --- Stratified train / val / test split ---
    # First split off test (20%)
    X_trainval, X_test, y_trainval, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_SEED, stratify=y
    )
    # Then split trainval into train (75% of 80% = 60%) and val (25% of 80% = 20%)
    X_train, X_val, y_train, y_val = train_test_split(
        X_trainval, y_trainval, test_size=0.25, random_state=RANDOM_SEED, stratify=y_trainval
    )

    print(f"[preprocessing] Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
    print(f"  Fraud in train: {y_train.sum()} ({y_train.mean()*100:.3f}%)")
    print(f"  Fraud in val:   {y_val.sum()}")
    print(f"  Fraud in test:  {y_test.sum()}")

    # --- Fit scaler ONLY on training data ---
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_val   = scaler.transform(X_val)
    X_test  = scaler.transform(X_test)

    # Save scaler and feature names for inference
    os.makedirs(os.path.dirname(SCALER_PATH), exist_ok=True)
    joblib.dump(scaler, SCALER_PATH)
    joblib.dump(feature_cols, FEATURES_PATH)
    print(f"[preprocessing] Scaler saved → {SCALER_PATH}")

    return X_train, X_val, X_test, y_train, y_val, y_test, feature_cols


def preprocess_single(features: dict) -> np.ndarray:
    """
    Preprocess a single transaction for inference.
    Uses the saved scaler.
    """
    scaler = joblib.load(SCALER_PATH)
    feature_names = joblib.load(FEATURES_PATH)
    row = np.array([[features.get(f, 0.0) for f in feature_names]])
    return scaler.transform(row)


def preprocess_batch(df: pd.DataFrame) -> np.ndarray:
    """
    Preprocess a batch DataFrame for inference.
    """
    scaler = joblib.load(SCALER_PATH)
    feature_names = joblib.load(FEATURES_PATH)
    for f in feature_names:
        if f not in df.columns:
            df[f] = 0.0
    return scaler.transform(df[feature_names].values), feature_names
