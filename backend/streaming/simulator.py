"""
Real-time Transaction Stream Simulator (Simulating Kafka + Spark Streaming)
Generates high-speed, realistic UPI transactions with mixed legitimate activities
and modern fraud vectors across major Indian cities and banking handles.
"""

import time
import random
import uuid
from typing import Dict, Any, List
try:
    from ..ml.dataset_generator import INDIAN_CITIES, MERCHANTS, NAMES, POPULAR_BANKS
except Exception:
    from ml.dataset_generator import INDIAN_CITIES, MERCHANTS, NAMES, POPULAR_BANKS

class TransactionStreamSimulator:
    def __init__(self, community_store=None):
        self.community_store = community_store
        self.user_profiles = self._init_user_profiles()
        self.recent_locations = {} # user_id -> (lat, lon, timestamp, city)
        self.recent_txns_1h = {} # user_id -> count

    def _init_user_profiles(self) -> List[Dict[str, Any]]:
        profiles = []
        for i, name in enumerate(NAMES):
            handle = random.choice(POPULAR_BANKS)
            vpa = f"{name.lower().replace(' ', '')}@{handle}"
            city_info = random.choice(INDIAN_CITIES)
            profiles.append({
                "user_id": f"USR-{1000 + i}",
                "name": name,
                "vpa": vpa,
                "phone": f"+91 98{random.randint(100, 999)} {random.randint(10000, 99999)}",
                "home_city": city_info["city"],
                "home_state": city_info["state"],
                "home_lat": city_info["lat"],
                "home_lon": city_info["lon"],
                "registered_device": f"DEV-{random.randint(100000, 999999)}",
                "device_model": random.choice(["Samsung Galaxy S24", "iPhone 15", "OnePlus 12", "Redmi Note 13", "Pixel 8"]),
                "avg_txn_amount": float(random.choice([450.0, 1200.0, 3500.0, 8000.0])),
                "account_age_days": random.randint(120, 1200)
            })
        return profiles

    def generate_simulated_transaction(self, force_scenario: str = None) -> Dict[str, Any]:
        """
        Generates a realistic UPI transaction.
        If force_scenario is None, selects either legitimate (85%) or fraud (15%).
        """
        sender = random.choice(self.user_profiles)
        now_epoch = time.time()
        
        # Determine scenario
        if force_scenario:
            scenario = force_scenario
        else:
            scenario = random.choices(
                ["LEGITIMATE", "SIM_SWAP", "IMPOSSIBLE_TRAVEL", "VELOCITY_ATTACK", "FAKE_MERCHANT", "BLACKLISTED_RECIPIENT"],
                weights=[0.82, 0.04, 0.04, 0.04, 0.03, 0.03]
            )[0]

        is_p2p = 1
        device_anomaly = 0
        failed_pins = 0
        amount_dev = 1.0
        ip_risk = round(random.uniform(0.01, 0.15), 2)
        geo_velocity = round(random.uniform(2.0, 45.0), 1)
        city_data = next((c for c in INDIAN_CITIES if c["city"] == sender["home_city"]), INDIAN_CITIES[0])
        current_lat = city_data["lat"] + random.uniform(-0.02, 0.02)
        current_lon = city_data["lon"] + random.uniform(-0.02, 0.02)
        receiver_name = random.choice([u["name"] for u in self.user_profiles if u["name"] != sender["name"]])
        receiver_vpa = f"{receiver_name.lower().replace(' ', '')}@{random.choice(POPULAR_BANKS)}"
        receiver_trust = 0.85
        community_flags = 0

        # Behavioral tracking
        user_id = sender["user_id"]
        self.recent_txns_1h[user_id] = self.recent_txns_1h.get(user_id, 0) + 1
        txn_freq_1h = self.recent_txns_1h[user_id]
        txn_freq_24h = txn_freq_1h + random.randint(1, 4)

        if scenario == "LEGITIMATE":
            if random.random() < 0.4:
                is_p2p = 0
                merchant = random.choice([m for m in MERCHANTS if m["trust"] >= 0.70])
                receiver_name = merchant["name"]
                receiver_vpa = merchant["vpa"]
                receiver_trust = merchant["trust"]
                amount = float(random.choice([49.0, 189.0, 450.0, 999.0, 2499.0]))
            else:
                amount = float(round(sender["avg_txn_amount"] * random.uniform(0.4, 1.8), 2))
            amount_dev = round(amount / sender["avg_txn_amount"], 2)

        elif scenario == "SIM_SWAP":
            amount = float(random.randint(35000, 95000))
            amount_dev = round(amount / sender["avg_txn_amount"], 2)
            device_anomaly = 1
            failed_pins = random.choice([2, 3])
            ip_risk = round(random.uniform(0.65, 0.95), 2)
            receiver_vpa = "muleroot99@paytm"
            receiver_name = "Mule Extraction Acc"
            receiver_trust = 0.25

        elif scenario == "IMPOSSIBLE_TRAVEL":
            amount = float(random.randint(12000, 58000))
            amount_dev = round(amount / sender["avg_txn_amount"], 2)
            device_anomaly = 1
            # Pick a distant city across India (e.g. Mumbai to Delhi = 1400km in 10 mins)
            distant_cities = [c for c in INDIAN_CITIES if c["city"] != sender["home_city"]]
            distant = random.choice(distant_cities)
            city_data = distant
            current_lat = distant["lat"]
            current_lon = distant["lon"]
            geo_velocity = round(random.uniform(750.0, 1400.0), 1) # Supersonic / impossible travel speed
            receiver_vpa = f"cashexpress@{random.choice(POPULAR_BANKS)}"

        elif scenario == "VELOCITY_ATTACK":
            amount = float(random.randint(4999, 25000))
            txn_freq_1h = random.randint(8, 16)
            txn_freq_24h = txn_freq_1h + 5
            amount_dev = round(amount / sender["avg_txn_amount"], 2)
            receiver_vpa = f"rapidpay{random.randint(10, 99)}@ybl"
            receiver_trust = 0.35

        elif scenario == "FAKE_MERCHANT":
            is_p2p = 0
            fake_m = random.choice([m for m in MERCHANTS if m["trust"] < 0.20])
            receiver_name = fake_m["name"]
            receiver_vpa = fake_m["vpa"]
            receiver_trust = fake_m["trust"]
            amount = float(random.randint(2500, 18000))
            amount_dev = round(amount / sender["avg_txn_amount"], 2)
            community_flags = random.randint(3, 8)

        elif scenario == "BLACKLISTED_RECIPIENT":
            amount = float(random.randint(8000, 48000))
            receiver_vpa = "luckyprize@ybl"
            receiver_name = "Mega Lucky Contest"
            receiver_trust = 0.10
            community_flags = 14

        # Cross-reference with live community store if available
        if self.community_store:
            reported_count = self.community_store.get_flag_count_for_vpa(receiver_vpa)
            if reported_count > 0:
                community_flags = max(community_flags, reported_count)

        txn_id = f"UPI-{int(now_epoch * 1000)}-{random.randint(100, 999)}"

        return {
            "txn_id": txn_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_epoch)),
            "sender_name": sender["name"],
            "sender_vpa": sender["vpa"],
            "sender_phone": sender["phone"],
            "sender_city": sender["home_city"],
            "sender_state": sender["home_state"],
            "device_id": sender["registered_device"],
            "device_model": sender["device_model"],
            "receiver_name": receiver_name,
            "receiver_vpa": receiver_vpa,
            "amount": round(amount, 2),
            "hour_of_day": time.localtime(now_epoch).tm_hour,
            "day_of_week": time.localtime(now_epoch).tm_wday,
            "txn_frequency_last_1h": txn_freq_1h,
            "txn_frequency_last_24h": txn_freq_24h,
            "amount_deviation_from_avg": amount_dev,
            "device_fingerprint_anomaly": device_anomaly,
            "ip_reputation_score": ip_risk,
            "geo_velocity_kmph": geo_velocity,
            "merchant_trust_score": round(receiver_trust, 2),
            "is_p2p": is_p2p,
            "user_age_days": sender["account_age_days"],
            "community_flag_count": community_flags,
            "failed_pin_attempts_prior": failed_pins,
            "current_location": {
                "city": city_data["city"],
                "state": city_data["state"],
                "lat": current_lat,
                "lon": current_lon
            },
            "injected_scenario": scenario
        }
