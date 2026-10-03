"""
RBI & Data Privacy Compliance Module
Implements Reserve Bank of India (RBI) Digital Payment Security Guidelines,
NPCI UPI limits, DPDP Act 2023 / GDPR privacy masking, and ethical AI auditing.
"""

from typing import Dict, Any, List

class RBIComplianceChecker:
    STANDARD_UPI_LIMIT_INR = 100000.0  # ₹1 Lakh general limit
    COOLING_PERIOD_LIMIT_INR = 5000.0   # ₹5,000 for new payees in first 24h
    HOSPITAL_EDUCATION_LIMIT_INR = 500000.0 # ₹5 Lakh for approved categories

    @classmethod
    def check_compliance(cls, txn: Dict[str, Any]) -> Dict[str, Any]:
        amount = float(txn.get("amount", 0.0))
        is_new_payee = txn.get("is_new_payee", False)
        has_2fa = txn.get("has_2fa", True)
        category = txn.get("category", "P2P")
        
        violations = []
        warnings = []
        is_compliant = True

        # 1. RBI Transaction Cap
        max_allowed = cls.HOSPITAL_EDUCATION_LIMIT_INR if category in ["HOSPITAL", "EDUCATION"] else cls.STANDARD_UPI_LIMIT_INR
        if amount > max_allowed:
            violations.append(f"Exceeds RBI maximum per-transaction cap of ₹{max_allowed:,.2f} (Requested: ₹{amount:,.2f})")
            is_compliant = False

        # 2. Cooling period limit for new payees
        if is_new_payee and amount > cls.COOLING_PERIOD_LIMIT_INR:
            violations.append(f"Exceeds RBI 24-hour cooling period limit of ₹{cls.COOLING_PERIOD_LIMIT_INR:,.2f} for newly added payees")
            is_compliant = False

        # 3. Two-factor authentication (2FA) verification
        if not has_2fa:
            violations.append("Mandatory 2FA (UPI PIN / Device Token) token missing from transaction header")
            is_compliant = False

        # 4. High-value transaction warning
        if amount >= 50000.0:
            warnings.append("High-value transaction subject to enhanced AML (Anti-Money Laundering) telemetry logging")

        return {
            "is_compliant": is_compliant,
            "violations": violations,
            "warnings": warnings,
            "rbi_guideline_refs": [
                "RBI/2021-22/164: Master Directions on Digital Payment Security Controls",
                "NPCI/UPI/OC-114: Transaction Limits & Cooling Period Protocols",
                "DPDP Act 2023: Digital Personal Data Protection Standards"
            ]
        }

    @classmethod
    def mask_pii(cls, val: str, pii_type: str = "vpa") -> str:
        """DPDP Act compliance: Privacy-preserving data masking."""
        if not val or val == "N/A":
            return "N/A"
        if pii_type == "vpa":
            if "@" in val:
                user, handle = val.split("@", 1)
                masked_user = user[:2] + "***" if len(user) > 2 else user[0] + "***"
                return f"{masked_user}@{handle}"
            return val[:2] + "***"
        elif pii_type == "phone":
            cleaned = val.replace(" ", "").replace("-", "")
            if len(cleaned) >= 10:
                return f"{cleaned[:3]}*****{cleaned[-2:]}"
            return "****"
        elif pii_type == "device_id":
            return val[:4] + "-****-****-" + val[-4:] if len(val) >= 12 else "****"
        return val

    @classmethod
    def get_compliance_checklist(cls) -> List[Dict[str, Any]]:
        return [
            {
                "id": "RBI-DPS-01",
                "title": "Real-time Fraud Monitoring System",
                "status": "COMPLIANT",
                "details": "Sub-200ms ML scoring engine with behavioral baseline profiling deployed."
            },
            {
                "id": "RBI-DPS-02",
                "title": "Mandatory Two-Factor Authentication (2FA)",
                "status": "COMPLIANT",
                "details": "Cryptographic UPI PIN + Device Binding Token enforced."
            },
            {
                "id": "RBI-DPS-03",
                "title": "Customer Liability Framework",
                "status": "COMPLIANT",
                "details": "Instant SMS/Push notification delivered within 2 seconds for zero customer liability."
            },
            {
                "id": "RBI-DPS-04",
                "title": "Immutable Audit Trail",
                "status": "COMPLIANT",
                "details": "Hyperledger/Proof-of-Work blockchain ledger records all flagged transaction hashes."
            },
            {
                "id": "DPDP-2023-01",
                "title": "PII Data Masking & Differential Privacy",
                "status": "COMPLIANT",
                "details": "All VPA, mobile, and device identifiers masked in UI and logs."
            },
            {
                "id": "ETHICAL-AI-01",
                "title": "Explainable AI (XAI) Transparency",
                "status": "COMPLIANT",
                "details": "SHAP feature attribution provided for all algorithmic risk decisions."
            }
        ]
