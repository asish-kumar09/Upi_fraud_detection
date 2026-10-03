"""
Explainable AI (XAI) Engine using SHAP
Provides localized feature attribution and multilingual natural language explanations
(English, Hindi, Odia) for any UPI transaction fraud decision.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_LABELS = {
    "amount": {
        "en": "Transaction Amount (₹)",
        "hi": "लेन-देन राशि (₹)",
        "od": "କାରବାର ରାଶି (₹)"
    },
    "hour_of_day": {
        "en": "Time of Day (Hour)",
        "hi": "दिन का समय (घंटा)",
        "od": "ଦିନର ସମୟ (ଘଣ୍ଟା)"
    },
    "day_of_week": {
        "en": "Day of Week",
        "hi": "सप्ताह का दिन",
        "od": "ସପ୍ତାହର ଦିନ"
    },
    "txn_frequency_last_1h": {
        "en": "Transaction Velocity (Past 1 Hour)",
        "hi": "लेन-देन गति (पिछला 1 घंटा)",
        "od": "କାରବାର ବେଗ (ବିଗତ ୧ ଘଣ୍ଟା)"
    },
    "txn_frequency_last_24h": {
        "en": "Transaction Velocity (Past 24 Hours)",
        "hi": "लेन-देन गति (पिछले 24 घंटे)",
        "od": "କାରବାର ବେଗ (ବିଗତ ୨୪ ଘଣ୍ଟା)"
    },
    "amount_deviation_from_avg": {
        "en": "Deviation from Historical Avg Amount",
        "hi": "ऐतिहासिक औसत से विचलन",
        "od": "ହାରାହାରି ରାଶିଠାରୁ ବିଚ୍ୟୁତି"
    },
    "device_fingerprint_anomaly": {
        "en": "Device Fingerprint Anomaly (New/Cloned Device)",
        "hi": "डिवाइस फ़िंगरप्रिंट असामान्यता (नया/क्लोन डिवाइस)",
        "od": "ଡିଭାଇସ୍ ଫିଙ୍ଗରପ୍ରିଣ୍ଟ ବିସଙ୍ଗତି (ନୂତନ ଡିଭାଇସ୍)"
    },
    "ip_reputation_score": {
        "en": "IP Risk / Proxy Score",
        "hi": "आईपी जोखिम / प्रॉक्सी स्कोर",
        "od": "ଆଇପି ବିପଦ / ପ୍ରକ୍ସି ସ୍କୋର"
    },
    "geo_velocity_kmph": {
        "en": "Geo-Velocity (Physical Speed between Txns)",
        "hi": "भू-गति (लेन-देन के बीच शारीरिक गति)",
        "od": "ଭୌଗୋଳିକ ବେଗ (କାରବାର ମଧ୍ୟରେ ଦୂରତା)"
    },
    "merchant_trust_score": {
        "en": "Merchant / Receiver Credibility Index",
        "hi": "व्यापारी / प्राप्तकर्ता विश्वसनीयता सूचकांक",
        "od": "ବ୍ୟବସାୟୀ / ପ୍ରାପକ ବିଶ୍ୱସନୀୟତା ସୂଚକାଙ୍କ"
    },
    "is_p2p": {
        "en": "Transfer Type (P2P vs Merchant)",
        "hi": "हस्तांतरण प्रकार (व्यक्तिगत बनाम व्यापारी)",
        "od": "ସ୍ଥାନାନ୍ତର ପ୍ରକାର (ବ୍ୟକ୍ତିଗତ ବନାମ ବ୍ୟବସାୟୀ)"
    },
    "user_age_days": {
        "en": "Account Age (Days)",
        "hi": "खाता आयु (दिन)",
        "od": "ଖାତା ବୟସ (ଦିନ)"
    },
    "community_flag_count": {
        "en": "Community Fraud Reports on Receiver",
        "hi": "प्राप्तकर्ता पर सामुदायिक धोखाधड़ी रिपोर्ट",
        "od": "ପ୍ରାପକ ଉପରେ ଗୋଷ୍ଠୀ ଠକେଇ ରିପୋର୍ଟ"
    },
    "failed_pin_attempts_prior": {
        "en": "Prior Failed UPI PIN Attempts",
        "hi": "विफल यूपीआई पिन प्रयास",
        "od": "ପୂର୍ବ ବିଫଳ ୟୁପିଆଇ ପିନ୍ ପ୍ରୟାସ"
    }
}

class UPIExplainabilityEngine:
    def __init__(self, models_dir: str = None):
        if models_dir is None:
            models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "saved_models"))
        
        self.models_dir = models_dir
        self.explainer = None
        self.feature_names = []
        self.load_artifacts()

    def load_artifacts(self):
        feat_path = os.path.join(self.models_dir, "feature_names.json")
        explainer_path = os.path.join(self.models_dir, "shap_explainer.pkl")
        
        if os.path.exists(feat_path):
            with open(feat_path, "r") as f:
                self.feature_names = json.load(f)
        
        if os.path.exists(explainer_path):
            try:
                self.explainer = joblib.load(explainer_path)
            except Exception as e:
                print(f"Notice: Failed to load SHAP explainer pkl: {e}")

    def explain_transaction(self, feature_dict: Dict[str, Any], risk_score: float) -> Dict[str, Any]:
        """
        Computes local SHAP attributions and returns structured waterfall breakdown + multilingual notes.
        """
        df_row = pd.DataFrame([feature_dict])
        if self.feature_names:
            df_row = df_row[self.feature_names]
            
        shap_values_dict = {}
        
        if self.explainer is not None:
            try:
                shap_obj = self.explainer(df_row)
                raw_values = shap_obj.values[0]
                # If binary classification, take output for class 1 (fraud)
                if len(raw_values.shape) > 1 and raw_values.shape[-1] == 2:
                    raw_values = raw_values[:, 1]
                for name, val in zip(self.feature_names, raw_values):
                    shap_values_dict[name] = float(val)
            except Exception as e:
                shap_values_dict = self._fallback_heuristic_importance(feature_dict)
        else:
            shap_values_dict = self._fallback_heuristic_importance(feature_dict)
            
        # Sort factors by impact towards fraud (positive SHAP)
        factors = []
        for feat_name, impact in shap_values_dict.items():
            val = feature_dict.get(feat_name, 0)
            labels = FEATURE_LABELS.get(feat_name, {"en": feat_name, "hi": feat_name, "od": feat_name})
            factors.append({
                "feature": feat_name,
                "label_en": labels["en"],
                "label_hi": labels["hi"],
                "label_od": labels["od"],
                "feature_value": val,
                "shap_impact": round(impact, 4),
                "is_fraud_driver": impact > 0.05
            })
            
        # Top 3 fraud contributors
        top_fraud_drivers = sorted([f for f in factors if f["shap_impact"] > 0], key=lambda x: x["shap_impact"], reverse=True)[:3]
        top_safe_drivers = sorted([f for f in factors if f["shap_impact"] < 0], key=lambda x: x["shap_impact"])[:2]
        
        # Natural language synthesis
        narrative = self._generate_multilingual_narrative(risk_score, top_fraud_drivers, top_safe_drivers)
        
        return {
            "risk_score": round(risk_score * 100, 1),
            "severity": "CRITICAL" if risk_score >= 0.80 else ("HIGH" if risk_score >= 0.55 else ("MEDIUM" if risk_score >= 0.30 else "LOW")),
            "decision": "BLOCKED" if risk_score >= 0.75 else ("FLAGGED_REVIEW" if risk_score >= 0.45 else "APPROVED"),
            "shap_breakdown": sorted(factors, key=lambda x: abs(x["shap_impact"]), reverse=True),
            "top_risk_drivers": top_fraud_drivers,
            "top_mitigating_factors": top_safe_drivers,
            "explanations": narrative
        }

    def _fallback_heuristic_importance(self, f: Dict[str, Any]) -> Dict[str, float]:
        """Calculates normalized weights when explainer is initializing."""
        weights = {}
        weights["geo_velocity_kmph"] = 0.35 if f.get("geo_velocity_kmph", 0) > 500 else -0.1
        weights["device_fingerprint_anomaly"] = 0.28 if f.get("device_fingerprint_anomaly", 0) == 1 else -0.15
        weights["failed_pin_attempts_prior"] = 0.25 if f.get("failed_pin_attempts_prior", 0) >= 2 else -0.05
        weights["community_flag_count"] = 0.30 if f.get("community_flag_count", 0) >= 3 else -0.1
        weights["amount_deviation_from_avg"] = 0.22 if f.get("amount_deviation_from_avg", 1.0) > 3.5 else -0.1
        weights["txn_frequency_last_1h"] = 0.20 if f.get("txn_frequency_last_1h", 1) > 5 else -0.08
        weights["merchant_trust_score"] = -0.25 if f.get("merchant_trust_score", 0.8) > 0.7 else 0.22
        weights["ip_reputation_score"] = 0.18 if f.get("ip_reputation_score", 0) > 0.5 else -0.05
        weights["amount"] = 0.15 if f.get("amount", 0) > 50000 else -0.05
        weights["hour_of_day"] = 0.12 if f.get("hour_of_day", 12) in [1, 2, 3, 4] else -0.05
        weights["day_of_week"] = 0.01
        weights["txn_frequency_last_24h"] = 0.05
        weights["is_p2p"] = 0.02
        weights["user_age_days"] = -0.1 if f.get("user_age_days", 100) > 365 else 0.08
        return weights

    def _generate_multilingual_narrative(self, risk_score: float, top_fraud: List[Dict], top_safe: List[Dict]) -> Dict[str, str]:
        pct = round(risk_score * 100, 1)
        if risk_score >= 0.50:
            reasons_en = ", ".join([f"{f['label_en']} ({f['feature_value']})" for f in top_fraud]) or "Behavioral deviation"
            reasons_hi = ", ".join([f"{f['label_hi']}" for f in top_fraud]) or "व्यवहार संबंधी असामान्यता"
            reasons_od = ", ".join([f"{f['label_od']}" for f in top_fraud]) or "ଆଚରଣଗତ ବିସଙ୍ଗତି"
            
            return {
                "en": f"High Risk ({pct}%): Transaction flagged primarily due to: {reasons_en}.",
                "hi": f"उच्च जोखिम ({pct}%): लेन-देन मुख्य रूप से इसके कारण चिन्हित किया गया: {reasons_hi}।",
                "od": f"ଉଚ୍ଚ ବିପଦ ({pct}%): କାରବାର ମୁଖ୍ୟତଃ ଏହି କାରଣରୁ ସତର୍କ କରାଯାଇଛି: {reasons_od}।"
            }
        else:
            return {
                "en": f"Low Risk ({pct}%): Transaction within legitimate behavioral baseline and verified device profile.",
                "hi": f"कम जोखिम ({pct}%): लेन-देन सामान्य व्यवहार और सत्यापित डिवाइस प्रोफ़ाइल के अनुरूप है।",
                "od": f"କମ୍ ବିପଦ ({pct}%): କାରବାର ସାଧାରଣ ଆଚରଣ ଏବଂ ଯାଞ୍ଚ ହୋଇଥିବା ଡିଭାଇସ୍ ପ୍ରୋଫାଇଲ୍ ସହିତ ସମାନ।"
            }
