import requests, json, sys

BASE = "http://localhost:8000/api"
errors = []

def check(name, cond, detail=""):
    if cond:
        print(f"  ✓ {name}")
    else:
        print(f"  ✗ {name} — {detail}")
        errors.append(name)

print("=== FraudShield AI Integration Tests ===\n")

# Health
r = requests.get(f"{BASE}/health")
check("Health endpoint", r.status_code == 200)
check("Health returns ok", r.json().get("status") == "ok")

# Dashboard
r = requests.get(f"{BASE}/dashboard/stats")
d = r.json()
check("Dashboard stats", r.status_code == 200)
check("Dataset has transactions", d.get("total", 0) > 0, d.get("total"))
check("Fraud rate is set", d.get("fraud_pct", 0) > 0)
print(f"    Dataset: {d['total']} rows, {d['fraudulent']} fraud ({d['fraud_pct']}%)")

# Dataset overview
r = requests.get(f"{BASE}/dataset/overview")
check("Dataset overview", r.status_code == 200)

# Models
r = requests.get(f"{BASE}/models")
models = r.json()["models"]
check("Models endpoint", r.status_code == 200)
check("At least 2 models", len(models) >= 2, len(models))
check("Best model flagged", any(m["is_best"] for m in models))
print(f"    Models: {[m['id'] for m in models]}")

# Compare
r = requests.get(f"{BASE}/models/compare")
check("Model compare endpoint", r.status_code == 200)
metrics = r.json()["models"]
for m in metrics:
    print(f"    {m['display_name']}: recall={m['recall']*100:.1f}% pr_auc={m['pr_auc']*100:.1f}%")

# Single prediction — legitimate
legit = {f"V{i}": 0.0 for i in range(1,29)}
legit.update({"Time": 100, "Amount": 25.0})
r = requests.post(f"{BASE}/predict", json=legit)
p = r.json()
check("Predict endpoint returns 200", r.status_code == 200)
check("Legit prediction has label", "label" in p)
check("Legit prediction has probability", "fraud_probability" in p)
print(f"    Legit → {p['label']} ({p['fraud_probability']*100:.2f}%)")

# Single prediction — fraud pattern
fraud = {f"V{i}": 0.0 for i in range(1,29)}
fraud.update({"Time": 500, "Amount": 150.0, "V1": -3.5, "V2": 2.8, "V3": -2.9,
              "V4": 3.5, "V10": -3.0, "V11": -4.5, "V14": -3.2})
r = requests.post(f"{BASE}/predict", json=fraud)
p = r.json()
check("Fraud-pattern detection", p.get("prediction") == 1, p.get("label"))
print(f"    Fraud  → {p['label']} ({p['fraud_probability']*100:.2f}%)")

# Sample transactions
r = requests.get(f"{BASE}/predict/sample")
samples = r.json()["samples"]
check("Sample transactions loaded", len(samples) > 0)
n_fraud = sum(1 for s in samples if s["label"] == "FRAUD")
print(f"    Samples: {len(samples)} total, {n_fraud} fraud")

# Batch prediction (create a mini CSV)
import io, csv as csv_m
feats = ["Time","Amount"] + [f"V{i}" for i in range(1,29)]
buf = io.StringIO()
w = csv_m.DictWriter(buf, fieldnames=feats)
w.writeheader()
row = {f: "0.0" for f in feats}
row["Amount"] = "100.0"
w.writerow(row)
row2 = {f: "0.0" for f in feats}
row2.update({"Amount": "150.0", "V1": "-3.5", "V14": "-3.2", "V11": "-4.5"})
w.writerow(row2)
csv_data = buf.getvalue().encode()
r = requests.post(f"{BASE}/predict/batch", files={"file": ("test.csv", csv_data, "text/csv")})
batch = r.json()
check("Batch prediction", r.status_code == 200)
check("Batch returns total", batch.get("total") == 2)
print(f"    Batch: {batch['total']} total, {batch['fraudulent']} fraud")

print(f"\n{'='*40}")
if errors:
    print(f"FAILED: {len(errors)} test(s): {errors}")
    sys.exit(1)
else:
    print("ALL TESTS PASSED")
