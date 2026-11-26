"""
Synthetic Credit Card Fraud Dataset Generator
----------------------------------------------
Used ONLY when the real dataset is unavailable.
The real dataset can be downloaded from:
  https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud

This generator creates a dataset with the SAME SCHEMA as the real dataset:
  Time, V1-V28 (PCA components), Amount, Class (0=legit, 1=fraud)

It mimics the class imbalance (~0.17% fraud) and approximate statistical
properties so your ML code works correctly once you swap in the real data.

HOW TO REPLACE WITH REAL DATA:
  1. Download creditcard.csv from Kaggle
  2. Place it at:  backend/ml/data/creditcard.csv
  3. Delete this generated file (or keep it as backup)
"""

import numpy as np
import pandas as pd
import os

RANDOM_SEED = 42
N_TOTAL = 50000          # Smaller than real (284k) for fast training in dev
N_FRAUD = 85             # ~0.17% fraud rate, same ratio as real dataset
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "data", "creditcard.csv")


def generate():
    rng = np.random.RandomState(RANDOM_SEED)
    n_legit = N_TOTAL - N_FRAUD

    # --- Legitimate transactions ---
    legit_v = rng.randn(n_legit, 28)  # V1-V28 from PCA: roughly standard normal
    legit_amount = rng.exponential(scale=85, size=n_legit).clip(0.5, 5000)
    legit_time = np.sort(rng.uniform(0, 172800, n_legit))  # 2 days in seconds
    legit_class = np.zeros(n_legit, dtype=int)

    # --- Fraudulent transactions (shifted distributions to make them distinguishable) ---
    fraud_v = rng.randn(N_FRAUD, 28)
    # Shift some PCA components the way real fraud transactions tend to differ
    fraud_v[:, 0] = rng.normal(-3.5, 1.5, N_FRAUD)   # V1 strongly negative for fraud
    fraud_v[:, 1] = rng.normal(2.8, 1.2, N_FRAUD)    # V2
    fraud_v[:, 2] = rng.normal(-2.9, 1.3, N_FRAUD)   # V3
    fraud_v[:, 3] = rng.normal(3.5, 1.5, N_FRAUD)    # V4
    fraud_v[:, 9] = rng.normal(-3.0, 1.2, N_FRAUD)   # V10
    fraud_v[:, 10] = rng.normal(-4.5, 1.5, N_FRAUD)  # V11
    fraud_v[:, 11] = rng.normal(2.5, 1.0, N_FRAUD)   # V12
    fraud_v[:, 13] = rng.normal(-3.2, 1.2, N_FRAUD)  # V14
    fraud_amount = rng.exponential(scale=120, size=N_FRAUD).clip(0.5, 2500)
    fraud_time = rng.uniform(0, 172800, N_FRAUD)
    fraud_class = np.ones(N_FRAUD, dtype=int)

    # --- Combine ---
    V = np.vstack([legit_v, fraud_v])
    amount = np.concatenate([legit_amount, fraud_amount])
    time = np.concatenate([legit_time, fraud_time])
    classes = np.concatenate([legit_class, fraud_class])

    cols = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount", "Class"]
    data = np.column_stack([time, V, amount, classes])
    df = pd.DataFrame(data, columns=cols)
    df["Class"] = df["Class"].astype(int)

    # Shuffle rows
    df = df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"[generate_dataset] Saved {len(df)} rows → {OUTPUT_PATH}")
    print(f"  Legitimate: {(df['Class']==0).sum()}")
    print(f"  Fraudulent: {(df['Class']==1).sum()}")
    print(f"  Fraud rate: {df['Class'].mean()*100:.3f}%")
    return df


if __name__ == "__main__":
    generate()
