"""
Multi-Layer Fraud Scoring Engine
Combines Rule-based heuristics, Behavioral profiling, ML Ensemble probabilities,
and SHAP Explainability into a unified sub-200ms evaluation pipeline.
"""

import os
import time
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List

try:
    from .explainer import UPIExplainabilityEngine
except Exception:
    from ml.explainer import UPIExplainabilityEngine

class UPIFraudScoringEngine:
    def __init__(self, models_dir: str = None):
        if models_dir is None:
            models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "saved_models"))
            
        self.models_dir = models_dir
        self.model = None
        self.feature_names = []
        self.explainer_engine = UPIExplainabilityEngine(models_dir)
        self.load_model()

    def load_model(self):
        model_path = os.path.join(self.models_dir, "upi_ensemble_model.pkl")
        feat_path = os.path.join(self.models_dir, "feature_names.json")
        
        if os.path.exists(feat_path):
            with open(feat_path, "r") as f:
                self.feature_names = json.load(f)
                
        if os.path.exists(model_path):
            try:
                self.model = joblib.load(model_path)
                print(f"Loaded ML model successfully from {model_path}")
            except Exception as e:
                print(f"Warning: Failed to load model: {e}")

    def evaluate_transaction(self, txn_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for transaction scoring.
        Executes in < 50ms.
        """
        start_time = time.perf_counter()
        
        # 1. Extract feature dictionary
        features = self._extract_features(txn_payload)
        
        # 2. Layer 1: Rule-Based Heuristic Evaluation
        rule_triggers, rule_penalty = self._check_heuristics(features, txn_payload)
        
        # 3. Layer 2: Adaptive ML Ensemble Probability
        ml_probability = self._predict_ml_prob(features)
        
        # 4. Multi-Layer Score Fusion
        if rule_penalty >= 0.85:
            # Overriding critical safety rules (e.g. impossible travel or heavy blacklist)
            final_risk = max(ml_probability, rule_penalty)
        else:
            final_risk = (0.70 * ml_probability) + (0.30 * rule_penalty)
            
        final_risk = float(np.clip(final_risk, 0.0, 1.0))
        
        # 5. Determine Action & Severity
        if final_risk >= 0.75:
            action = "BLOCKED"
            severity = "CRITICAL"
        elif final_risk >= 0.45:
            action = "FLAGGED_REVIEW"
            severity = "HIGH" if final_risk >= 0.60 else "MEDIUM"
        else:
            action = "APPROVED"
            severity = "LOW"
            
        # 6. Layer 3: Explainable AI Attribution
        explanation = self.explainer_engine.explain_transaction(features, final_risk)
        
        latency_ms = (time.perf_counter() - start_time) * 1000
        
        result = {
            "txn_id": txn_payload.get("txn_id", f"UPI-{int(time.time()*1000)}"),
            "sender_vpa": txn_payload.get("sender_vpa", "unknown@upi"),
            "receiver_vpa": txn_payload.get("receiver_vpa", "unknown@upi"),
            "amount": float(features.get("amount", 0.0)),
            "risk_score": round(final_risk, 4),
            "risk_percentage": round(final_risk * 100, 1),
            "action": action,
            "severity": severity,
            "rule_triggers": rule_triggers,
            "ml_probability": round(float(ml_probability), 4),
            "heuristic_penalty": round(float(rule_penalty), 4),
            "latency_ms": round(latency_ms, 2),
            "latency_compliant": latency_ms < 200.0,
            "features_snapshot": features,
            "explainability": explanation
        }
        return result

    def _extract_features(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Maps incoming raw UPI transaction payload to standard features."""
        return {
            "amount": float(payload.get("amount", 100.0)),
            "hour_of_day": int(payload.get("hour_of_day", time.localtime().tm_hour)),
            "day_of_week": int(payload.get("day_of_week", time.localtime().tm_wday)),
            "txn_frequency_last_1h": int(payload.get("txn_frequency_last_1h", 1)),
            "txn_frequency_last_24h": int(payload.get("txn_frequency_last_24h", 2)),
            "amount_deviation_from_avg": float(payload.get("amount_deviation_from_avg", 1.0)),
            "device_fingerprint_anomaly": int(payload.get("device_fingerprint_anomaly", 0)),
            "ip_reputation_score": float(payload.get("ip_reputation_score", 0.05)),
            "geo_velocity_kmph": float(payload.get("geo_velocity_kmph", 15.0)),
            "merchant_trust_score": float(payload.get("merchant_trust_score", 0.85)),
            "is_p2p": int(payload.get("is_p2p", 1)),
            "user_age_days": int(payload.get("user_age_days", 365)),
            "community_flag_count": int(payload.get("community_flag_count", 0)),
            "failed_pin_attempts_prior": int(payload.get("failed_pin_attempts_prior", 0))
        }

    def _check_heuristics(self, f: Dict[str, Any], raw: Dict[str, Any]) -> Tuple[List[str], float]:
        """Calculates deterministic rule breaches and penalties."""
        triggers = []
        penalty = 0.05
        
        # Rule 1: Impossible Travel (> 750 km/h)
        if f["geo_velocity_kmph"] > 750.0:
            triggers.append(f"CRITICAL: Impossible travel velocity ({f['geo_velocity_kmph']} km/h)")
            penalty += 0.70
            
        # Rule 2: Heavy Community Blacklist
        if f["community_flag_count"] >= 3:
            triggers.append(f"HIGH: Recipient reported in community blacklist ({f['community_flag_count']} reports)")
            penalty += 0.50
            
        # Rule 3: Extreme Amount Deviation
        if f["amount_deviation_from_avg"] > 6.0:
            triggers.append(f"HIGH: Amount is {f['amount_deviation_from_avg']}x higher than user's 30-day baseline")
            penalty += 0.35
            
        # Rule 4: Device Anomaly + Prior Failed PINs (Account Takeover indicator)
        if f["device_fingerprint_anomaly"] == 1 and f["failed_pin_attempts_prior"] >= 2:
            triggers.append("CRITICAL: Unrecognized device combined with multiple prior failed PIN attempts")
            penalty += 0.65
            
        # Rule 5: High Velocity Burst (> 6 txns in 1 hour)
        if f["txn_frequency_last_1h"] > 6:
            triggers.append(f"MEDIUM: Rapid burst velocity ({f['txn_frequency_last_1h']} transactions in 1 hour)")
            penalty += 0.30
            
        # Rule 6: Untrusted Merchant / Fake QR Code
        if f["is_p2p"] == 0 and f["merchant_trust_score"] < 0.20:
            triggers.append(f"HIGH: Recipient merchant has critically low trust index ({f['merchant_trust_score']})")
            penalty += 0.45
            
        return triggers, min(1.0, penalty)

    def _predict_ml_prob(self, features: Dict[str, Any]) -> float:
        """Inference with Random Forest + Gradient Boosting ensemble."""
        if self.model is None or not self.feature_names:
            # Fallback heuristic probability
            return 0.10
            
        try:
            df = pd.DataFrame([features])[self.feature_names]
            prob = self.model.predict_proba(df)[0][1]
            return float(prob)
        except Exception as e:
            print(f"Prediction error: {e}")
            return 0.15
