# FraudShield AI
### Credit Card Fraud Detection System

> "Detect Fraud Before It Becomes a Financial Loss."

A complete credit card fraud detection application using **classical Machine Learning** (Decision Tree, Random Forest, XGBoost, LightGBM) with a React frontend and FastAPI backend.

---

## Features

- **8-page React web application** with dark-mode fintech UI
- **4 ML models** trained with class imbalance handling
- **Single transaction detection** — enter features and get a fraud prediction
- **Batch CSV detection** — upload thousands of transactions, download results
- **Interactive dashboard** — real dataset stats and model metrics
- **Model comparison** — precision/recall/F1/PR-AUC with confusion matrices
- **ML algorithm education** — explanation of every algorithm with viva answers
- **Dataset explorer** — data quality, class distribution, amount statistics
- **Academic methodology** — full ML pipeline with leakage prevention

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| ML | Scikit-learn, XGBoost, LightGBM, Imbalanced-learn |
| Data | Pandas, NumPy, Joblib |
| Storage | Joblib (.pkl), JSON (metrics), CSV (dataset) |

---

## Project Structure

```
credit-card-fraud-detection/
├── backend/
│   ├── app/
│   │   ├── main.py           ← FastAPI application
│   │   ├── routes/           ← API endpoints
│   │   └── schemas/          ← Pydantic models
│   ├── ml/
│   │   ├── data/             ← Place creditcard.csv here
│   │   ├── models/           ← Trained .pkl files (auto-created)
│   │   ├── generate_dataset.py ← Synthetic data generator
│   │   ├── preprocessing.py  ← Split + scale pipeline
│   │   ├── train.py          ← Train all models
│   │   ├── evaluate.py       ← Metrics for API
│   │   └── predict.py        ← Inference module
│   ├── run.py                ← Start backend
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            ← 8 application pages
│   │   ├── components/       ← Reusable UI components
│   │   ├── layouts/          ← Sidebar layout
│   │   └── services/api.js   ← Centralized API client
│   └── package.json
└── README.md
```

---

## Dataset

**Recommended:** European Credit Card Fraud Dataset

Download from: https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud

Place the file at: `backend/ml/data/creditcard.csv`

**Without the real dataset**, run the synthetic generator (included):
```bash
python backend/ml/generate_dataset.py
```
This creates 50,000 transactions with the same schema and ~0.17% fraud rate.

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 8+

### Step 1 — Install Python dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 2 — Prepare the dataset
```bash
# Option A: Use synthetic data (for testing)
python backend/ml/generate_dataset.py

# Option B: Download real data from Kaggle
# Place creditcard.csv in backend/ml/data/
```

### Step 3 — Train the models
```bash
python backend/ml/train.py
```
Expected output: 4 models saved to `backend/ml/models/`

### Step 4 — Start the backend
```bash
python backend/run.py
```
API available at: http://localhost:8000/api/docs

### Step 5 — Install frontend dependencies
```bash
cd frontend
npm install
```

### Step 6 — Start the frontend
```bash
npm run dev
```
App available at: http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/dashboard/stats | Dataset statistics + best model |
| GET | /api/dataset/overview | Detailed dataset info |
| GET | /api/models | List trained models |
| GET | /api/models/compare | All model metrics + ROC/PRC curves |
| GET | /api/models/evaluation | Best model evaluation |
| GET | /api/predict/sample | Sample transactions from dataset |
| POST | /api/predict | Single transaction prediction |
| POST | /api/predict/batch | Batch CSV prediction |

Full documentation: http://localhost:8000/api/docs

---

## ML Methodology

### Data Leakage Prevention
1. Load dataset
2. **Split BEFORE scaling**: 60% train / 20% val / 20% test (stratified)
3. Fit `StandardScaler` on train data only
4. Transform all three splits with the fitted scaler

### Class Imbalance Handling
- 0.17% fraud rate → 99.83% accuracy with no model (always predicts legitimate)
- Solution: `class_weight='balanced'` in Decision Tree and Random Forest
- For XGBoost: `scale_pos_weight = n_negative / n_positive`

### Model Selection
- Evaluate all models on the **validation set only** during selection
- Select by **PR-AUC**, not accuracy
- Evaluate the best model once on the **untouched test set**

### Why PR-AUC?
- With 0.17% fraud, accuracy is a useless metric
- PR-AUC measures the trade-off between catching fraud (Recall) and minimizing false alarms (Precision)
- A model with PR-AUC = 1.0 catches all fraud with no false positives

---

## Model Results (Synthetic Dataset)

| Model | Recall | Precision | F1 | PR-AUC |
|-------|--------|-----------|-----|--------|
| Decision Tree | 88.2% | 93.8% | 90.9% | 82.4% |
| **Random Forest ★** | **100%** | **100%** | **100%** | **100%** |
| XGBoost | 100% | 100% | 100% | 100% |
| LightGBM | 100% | 100% | 100% | 100% |

> Note: 100% metrics on synthetic data indicate the synthetic data is learnable. Real Kaggle data will show more realistic scores (RF typically achieves ~85-95% PR-AUC on the real dataset).

---

## Running Tests

```bash
# Test ML pipeline
cd backend
python -c "from ml.preprocessing import prepare_data; print(prepare_data()[-1])"

# Test predictions
python -c "
import sys; sys.path.insert(0, 'ml')
from predict import predict_single
print(predict_single({'Time': 0, 'Amount': 100, **{f'V{i}': 0 for i in range(1, 29)}}))"

# Test API endpoints
python -c "
import requests
print(requests.get('http://localhost:8000/api/health').json())
print(requests.get('http://localhost:8000/api/models').json()['models'][0]['display_name'])
"
```

---

## Viva Preparation

**Q: Why did you use class_weight='balanced'?**
> "The dataset has only 0.17% fraud. Without handling, the model learns to always predict legitimate and achieves 99.83% accuracy but catches no fraud. class_weight='balanced' increases the penalty for misclassifying fraud transactions proportionally to their rarity."

**Q: Why did you use PR-AUC to select the best model?**
> "Accuracy is misleading for imbalanced data. PR-AUC measures the trade-off between Precision and Recall at all possible thresholds. A model with high PR-AUC both catches fraud effectively and minimizes false alarms."

**Q: What is data leakage and how did you prevent it?**
> "Data leakage occurs when information from the test set influences model training. I prevented it by splitting the data before fitting any preprocessing. The StandardScaler was fitted only on training data, then applied to validation and test data."

**Q: What is the difference between Random Forest and Decision Tree?**
> "A Decision Tree is a single model that splits data recursively. A Random Forest builds 100 trees, each on a random bootstrap sample with random feature selection at each split. The final prediction is the majority vote. Random Forest is more accurate and less prone to overfitting because the trees are diverse and decorrelated."

---

## Known Limitations

1. The synthetic dataset is not identical to the real one — replace with Kaggle data for real metrics.
2. V1-V28 are anonymous PCA features; individual feature explanations are not human-readable.
3. No real-time retraining. Models reflect the training data snapshot.
4. Batch upload is capped at 10,000 rows.

---

## License

Educational project. Not for production financial use.
