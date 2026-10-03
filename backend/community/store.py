"""
Community Fraud Reporting System
Crowdsourced validation, report registry, upvoting, and reputation tracking for UPI fraud prevention.
"""

import time
import json
import os
from typing import List, Dict, Any, Optional

class CommunityFraudStore:
    def __init__(self, persistence_file: Optional[str] = None):
        self.persistence_file = persistence_file or os.path.join(
            os.path.dirname(__file__), "..", "saved_models", "community_reports.json"
        )
        self.reports: List[Dict[str, Any]] = []
        self.load_reports()

    def load_reports(self):
        if os.path.exists(self.persistence_file):
            try:
                with open(self.persistence_file, "r") as f:
                    self.reports = json.load(f)
                    return
            except Exception as e:
                print(f"Error loading community reports: {e}")
                
        # Initial seed reports for realistic community database
        self.reports = [
            {
                "report_id": "CR-1001",
                "target_vpa": "luckyprize@ybl",
                "target_phone": "+91 98231 00213",
                "fraud_type": "LOTTERY_PHISHING",
                "description": "Sent fake SMS claiming ₹50,000 reward and asked to approve ₹2,000 UPI request.",
                "reported_by": "Aarav S.",
                "upvotes": 14,
                "downvotes": 0,
                "status": "VERIFIED_FRAUD",
                "timestamp": "2026-09-24T10:15:00Z"
            },
            {
                "report_id": "CR-1002",
                "target_vpa": "earninstant@paytm",
                "target_phone": "+91 94120 88219",
                "fraud_type": "PART_TIME_JOB_SCAM",
                "description": "Telegram group scam asking to pay ₹5,000 deposit for YouTube video like tasks.",
                "reported_by": "Priya P.",
                "upvotes": 9,
                "downvotes": 1,
                "status": "VERIFIED_FRAUD",
                "timestamp": "2026-09-24T14:30:00Z"
            },
            {
                "report_id": "CR-1003",
                "target_vpa": "refundsupport@sbi",
                "target_phone": "+91 91987 55410",
                "fraud_type": "FAKE_BANK_SUPPORT",
                "description": "Impersonated SBI customer service executive asking to share screen via AnyDesk.",
                "reported_by": "Manish M.",
                "upvotes": 22,
                "downvotes": 0,
                "status": "VERIFIED_FRAUD",
                "timestamp": "2026-09-25T08:20:00Z"
            }
        ]
        self.save_reports()

    def save_reports(self):
        try:
            os.makedirs(os.path.dirname(self.persistence_file), exist_ok=True)
            with open(self.persistence_file, "w") as f:
                json.dump(self.reports, f, indent=2)
        except Exception as e:
            print(f"Error saving community reports: {e}")

    def add_report(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        report_id = f"CR-{int(time.time() * 1000) % 100000}"
        new_report = {
            "report_id": report_id,
            "target_vpa": report_data.get("target_vpa", "").strip().lower(),
            "target_phone": report_data.get("target_phone", "N/A"),
            "fraud_type": report_data.get("fraud_type", "GENERAL_FRAUD"),
            "description": report_data.get("description", ""),
            "reported_by": report_data.get("reported_by", "Anonymous User"),
            "upvotes": 1,
            "downvotes": 0,
            "status": "UNDER_REVIEW",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        self.reports.insert(0, new_report)
        self.save_reports()
        return new_report

    def vote_report(self, report_id: str, is_upvote: bool = True) -> Optional[Dict[str, Any]]:
        for r in self.reports:
            if r["report_id"] == report_id:
                if is_upvote:
                    r["upvotes"] += 1
                else:
                    r["downvotes"] += 1
                
                # Auto verification threshold
                if r["upvotes"] - r["downvotes"] >= 3:
                    r["status"] = "VERIFIED_FRAUD"
                elif r["downvotes"] - r["upvotes"] >= 3:
                    r["status"] = "CLEARED"
                    
                self.save_reports()
                return r
        return None

    def get_flag_count_for_vpa(self, vpa: str) -> int:
        if not vpa:
            return 0
        vpa_clean = vpa.strip().lower()
        count = 0
        for r in self.reports:
            if r["target_vpa"] == vpa_clean and r["status"] in ["VERIFIED_FRAUD", "UNDER_REVIEW"]:
                count += max(1, r["upvotes"])
        return count

    def get_all_reports(self) -> List[Dict[str, Any]]:
        return self.reports
