"""
UPI Fraud Detection - Model Training Pipeline
Trains an Ensemble Model (Random Forest + Gradient Boosting) on synthetic UPI data,
evaluates critical performance metrics (Accuracy > 95%, Precision > 90%, Recall > 92%),
benchmarks inference latency (<200ms), and serializes the model and SHAP background data.
"""

import os
import time
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import shap

from dataset_generator import generate_upi_dataset

FEATURE_NAMES = [
    "amount",
    "hour_of_day",
    "day_of_week",
    "txn_frequency_last_1h",
    "txn_frequency_last_24h",
    "amount_deviation_from_avg",
    "device_fingerprint_anomaly",
    "ip_reputation_score",
    "geo_velocity_kmph",
    "merchant_trust_score",
    "is_p2p",
    "user_age_days",
    "community_flag_count",
    "failed_pin_attempts_prior"
]

def train_upi_ensemble(save_dir: str = None):
    if save_dir is None:
        save_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "saved_models"))
    os.makedirs(save_dir, exist_ok=True)
    
    print("[1/5] Generating realistic UPI training dataset...")
    df = generate_upi_dataset(num_samples=16000, fraud_ratio=0.12, random_seed=42)
    
    X = df[FEATURE_NAMES]
    y = df["is_fraud"]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    print(f"Dataset split: Train samples = {len(X_train)}, Test samples = {len(X_test)}")
    
    print("[2/5] Training Random Forest and Gradient Boosting ensemble...")
    rf_model = RandomForestClassifier(
        n_estimators=120,
        max_depth=14,
        min_samples_split=4,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    
    gb_model = GradientBoostingClassifier(
        n_estimators=100,
        learning_rate=0.08,
        max_depth=6,
        random_state=42
    )
    
    ensemble = VotingClassifier(
        estimators=[
            ("rf", rf_model),
            ("gb", gb_model)
        ],
        voting="soft",
        weights=[0.6, 0.4]
    )
    
    start_time = time.time()
    ensemble.fit(X_train, y_train)
    train_duration = time.time() - start_time
    print(f"Ensemble training completed in {train_duration:.2f} seconds.")
    
    print("[3/5] Evaluating performance metrics...")
    y_pred = ensemble.predict(X_test)
    y_prob = ensemble.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    
    # Latency benchmark
    latencies = []
    sample_rows = X_test.iloc[:200]
    for _, row in sample_rows.iterrows():
        t0 = time.perf_counter()
        _ = ensemble.predict_proba([row.values])
        latencies.append((time.perf_counter() - t0) * 1000) # in ms
        
    avg_latency_ms = float(np.mean(latencies))
    p95_latency_ms = float(np.percentile(latencies, 95))
    
    metrics = {
        "model_name": "UPI Ensemble (Random Forest + Gradient Boosting)",
        "model_version": "v1.4.0-adaptive",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(float(acc) * 100, 2),
        "precision": round(float(prec) * 100, 2),
        "recall": round(float(rec) * 100, 2),
        "f1_score": round(float(f1) * 100, 2),
        "roc_auc": round(float(roc_auc) * 100, 2),
        "avg_latency_ms": round(avg_latency_ms, 2),
        "p95_latency_ms": round(p95_latency_ms, 2),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "target_benchmarks_met": {
            "accuracy_gt_95": bool(acc >= 0.95),
            "precision_gt_90": bool(prec >= 0.90),
            "recall_gt_92": bool(rec >= 0.92),
            "latency_lt_200ms": bool(avg_latency_ms < 200.0)
        }
    }
    
    print("=" * 60)
    print("PERFORMANCE METRICS SUMMARY:")
    print(f"Accuracy:  {metrics['accuracy']}% (Benchmark > 95%: {metrics['target_benchmarks_met']['accuracy_gt_95']})")
    print(f"Precision: {metrics['precision']}% (Benchmark > 90%: {metrics['target_benchmarks_met']['precision_gt_90']})")
    print(f"Recall:    {metrics['recall']}% (Benchmark > 92%: {metrics['target_benchmarks_met']['recall_gt_92']})")
    print(f"F1-Score:  {metrics['f1_score']}%")
    print(f"ROC AUC:   {metrics['roc_auc']}%")
    print(f"Avg Latency: {metrics['avg_latency_ms']} ms (Benchmark < 200ms: {metrics['target_benchmarks_met']['latency_lt_200ms']})")
    print("=" * 60)
    
    print("[4/5] Preparing SHAP Explainer on Random Forest component...")
    # Fits a fast TreeExplainer on a subset of background data
    fitted_rf = ensemble.named_estimators_["rf"]
    background_data = X_train.sample(n=100, random_state=42)
    explainer = shap.TreeExplainer(fitted_rf, data=background_data)
    
    print("[5/5] Saving model artifacts to disk...")
    model_file = os.path.join(save_dir, "upi_ensemble_model.pkl")
    explainer_file = os.path.join(save_dir, "shap_explainer.pkl")
    metrics_file = os.path.join(save_dir, "model_metrics.json")
    feature_file = os.path.join(save_dir, "feature_names.json")
    
    joblib.dump(ensemble, model_file)
    joblib.dump(explainer, explainer_file)
    with open(metrics_file, "w") as f:
        json.dump(metrics, f, indent=2)
    with open(feature_file, "w") as f:
        json.dump(FEATURE_NAMES, f, indent=2)
        
    print(f"Models successfully saved to: {save_dir}")
    return metrics

if __name__ == "__main__":
    train_upi_ensemble()
