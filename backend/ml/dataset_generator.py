"""
UPI Fraud Detection - Realistic Dataset Generator
Generates realistic Indian UPI transaction data covering both legitimate 
consumer/merchant behaviors and distinct modern UPI fraud attack vectors.
"""

import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta

INDIAN_CITIES = [
    {"city": "Mumbai", "lat": 19.0760, "lon": 72.8777, "state": "Maharashtra"},
    {"city": "Delhi", "lat": 28.6139, "lon": 77.2090, "state": "Delhi"},
    {"city": "Bengaluru", "lat": 12.9716, "lon": 77.5946, "state": "Karnataka"},
    {"city": "Hyderabad", "lat": 17.3850, "lon": 78.4867, "state": "Telangana"},
    {"city": "Bhubaneswar", "lat": 20.2961, "lon": 85.8245, "state": "Odisha"},
    {"city": "Kolkata", "lat": 22.5726, "lon": 88.3639, "state": "West Bengal"},
    {"city": "Chennai", "lat": 13.0827, "lon": 80.2707, "state": "Tamil Nadu"},
    {"city": "Pune", "lat": 18.5204, "lon": 73.8567, "state": "Maharashtra"},
    {"city": "Ahmedabad", "lat": 23.0225, "lon": 72.5714, "state": "Gujarat"},
    {"city": "Jaipur", "lat": 26.9124, "lon": 75.7873, "state": "Rajasthan"},
]

POPULAR_BANKS = ["okhdfcbank", "okaxis", "icici", "sbi", "paytm", "kotak", "ybl"]
NAMES = [
    "Aarav Sharma", "Priya Patel", "Deepak Verma", "Ananya Rao", "Rahul Mishra",
    "Sneha Reddy", "Vikram Singh", "Pooja Das", "Rajesh Nair", "Sunita Sen",
    "Manish Mohanty", "Swati Panda", "Karan Kapoor", "Ritu Roy", "Amit Sahu"
]

MERCHANTS = [
    {"name": "Swiggy Online", "trust": 0.95, "vpa": "swiggy@icici"},
    {"name": "Zomato Foods", "trust": 0.96, "vpa": "zomato@hdfc"},
    {"name": "Amazon India", "trust": 0.98, "vpa": "amazonpay@axis"},
    {"name": "Flipkart Internet", "trust": 0.97, "vpa": "flipkart@axis"},
    {"name": "Reliance Retail", "trust": 0.94, "vpa": "relsmart@sbi"},
    {"name": "Apollo Pharmacy", "trust": 0.93, "vpa": "apollopharm@icici"},
    {"name": "Local Kirana Store", "trust": 0.75, "vpa": "kirana77@paytm"},
    {"name": "Quick Cash Promo", "trust": 0.15, "vpa": "luckyprize@ybl"},
    {"name": "Crypto Bonus UPI", "trust": 0.08, "vpa": "earninstant@paytm"},
    {"name": "Fake Tech Support", "trust": 0.05, "vpa": "refundsupport@sbi"}
]

def generate_upi_dataset(num_samples: int = 15000, fraud_ratio: float = 0.12, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)
    random.seed(random_seed)
    
    num_fraud = int(num_samples * fraud_ratio)
    num_legit = num_samples - num_fraud
    
    data = []

    # 1. Generate Legitimate Transactions
    for _ in range(num_legit):
        is_p2p = 1 if random.random() < 0.45 else 0
        hour_probs = np.array([0.01, 0.005, 0.005, 0.005, 0.01, 0.02, 0.05, 0.07, 0.08, 0.09, 0.08, 0.08, 0.07, 0.07, 0.07, 0.07, 0.07, 0.08, 0.08, 0.07, 0.06, 0.04, 0.02, 0.01])
        hour_probs = hour_probs / hour_probs.sum()
        hour = int(np.random.choice(range(24), p=hour_probs))
        day_of_week = random.randint(0, 6)
        
        # Typical amounts in INR
        if is_p2p:
            amount = float(np.random.choice([
                np.random.uniform(50, 1500),
                np.random.uniform(1500, 5000),
                np.random.uniform(5000, 20000)
            ], p=[0.70, 0.22, 0.08]))
            merchant_trust = 0.85 + np.random.uniform(-0.05, 0.10)
        else:
            amount = float(np.random.choice([
                np.random.uniform(15, 600),
                np.random.uniform(600, 3000),
                np.random.uniform(3000, 15000)
            ], p=[0.65, 0.28, 0.07]))
            merchant = random.choice([m for m in MERCHANTS if m["trust"] >= 0.70])
            merchant_trust = merchant["trust"] + np.random.uniform(-0.03, 0.03)

        # Legitimate behavioral signals
        txn_freq_1h = int(np.random.choice([1, 2, 3, 4], p=[0.75, 0.18, 0.05, 0.02]))
        txn_freq_24h = txn_freq_1h + int(np.random.choice([0, 1, 2, 4, 6], p=[0.40, 0.30, 0.18, 0.09, 0.03]))
        amount_dev = max(0.2, np.random.normal(1.0, 0.35))
        device_anomaly = 1 if random.random() < 0.02 else 0 # 2% chance of device change (e.g. bought new phone)
        ip_reputation = max(0.0, min(0.3, np.random.normal(0.05, 0.05)))
        geo_velocity = float(np.random.exponential(scale=18.0)) # Normal travel speed < 80 km/h
        user_age = int(np.random.uniform(90, 1500))
        community_flags = 0
        failed_pins = 1 if random.random() < 0.04 else 0 # Rare accidental typo

        data.append({
            "amount": round(amount, 2),
            "hour_of_day": hour,
            "day_of_week": day_of_week,
            "txn_frequency_last_1h": txn_freq_1h,
            "txn_frequency_last_24h": txn_freq_24h,
            "amount_deviation_from_avg": round(amount_dev, 2),
            "device_fingerprint_anomaly": device_anomaly,
            "ip_reputation_score": round(ip_reputation, 3),
            "geo_velocity_kmph": round(geo_velocity, 1),
            "merchant_trust_score": round(max(0.0, min(1.0, merchant_trust)), 3),
            "is_p2p": is_p2p,
            "user_age_days": user_age,
            "community_flag_count": community_flags,
            "failed_pin_attempts_prior": failed_pins,
            "is_fraud": 0
        })

    # 2. Generate Fraud Scenarios
    fraud_archetypes = [
        "SIM_SWAP_ACCOUNT_TAKEOVER",
        "RAPID_VELOCITY_DRAIN",
        "IMPOSSIBLE_TRAVEL_GEO_MISMATCH",
        "FAKE_MERCHANT_QR_PHISHING",
        "CROWDSOURCED_FRAUD_RING"
    ]

    for _ in range(num_fraud):
        archetype = random.choice(fraud_archetypes)
        is_p2p = 1 if random.random() < 0.60 else 0
        day_of_week = random.randint(0, 6)

        if archetype == "SIM_SWAP_ACCOUNT_TAKEOVER":
            # Attacker logged in from new device, tried guessing PIN, transferred large sum at night
            hour = random.choice([0, 1, 2, 3, 4, 23])
            amount = float(np.random.uniform(25000, 98000))
            txn_freq_1h = random.randint(2, 5)
            txn_freq_24h = txn_freq_1h + random.randint(1, 3)
            amount_dev = float(np.random.uniform(4.5, 12.0))
            device_anomaly = 1
            ip_reputation = float(np.random.uniform(0.60, 0.95))
            geo_velocity = float(np.random.uniform(40, 200))
            merchant_trust = 0.40 if is_p2p else 0.20
            user_age = int(np.random.uniform(30, 800))
            community_flags = random.randint(0, 2)
            failed_pins = random.choice([2, 3, 4])

        elif archetype == "RAPID_VELOCITY_DRAIN":
            # Multiple rapid transactions in short succession (money mule draining)
            hour = random.randint(0, 23)
            amount = float(np.random.uniform(5000, 45000))
            txn_freq_1h = random.randint(7, 18)
            txn_freq_24h = txn_freq_1h + random.randint(4, 15)
            amount_dev = float(np.random.uniform(3.0, 7.5))
            device_anomaly = 1 if random.random() < 0.5 else 0
            ip_reputation = float(np.random.uniform(0.40, 0.85))
            geo_velocity = float(np.random.uniform(10, 120))
            merchant_trust = 0.50 if is_p2p else 0.25
            user_age = int(np.random.uniform(10, 300))
            community_flags = random.randint(1, 4)
            failed_pins = random.randint(0, 2)

        elif archetype == "IMPOSSIBLE_TRAVEL_GEO_MISMATCH":
            # Consecutive transactions physically impossible to traverse in time (e.g. 800-1500 km/h)
            hour = random.randint(6, 22)
            amount = float(np.random.uniform(8000, 65000))
            txn_freq_1h = random.randint(2, 6)
            txn_freq_24h = txn_freq_1h + random.randint(2, 6)
            amount_dev = float(np.random.uniform(2.5, 6.0))
            device_anomaly = 1
            ip_reputation = float(np.random.uniform(0.50, 0.90))
            geo_velocity = float(np.random.uniform(650.0, 1600.0)) # Impossible physical travel
            merchant_trust = 0.50 if is_p2p else 0.30
            user_age = int(np.random.uniform(60, 1000))
            community_flags = random.randint(0, 3)
            failed_pins = random.randint(0, 1)

        elif archetype == "FAKE_MERCHANT_QR_PHISHING":
            # Fraudulent merchant QR code or deceptive lucky draw phishing
            is_p2p = 0
            hour = random.randint(9, 21)
            amount = float(np.random.uniform(2000, 35000))
            txn_freq_1h = random.randint(1, 3)
            txn_freq_24h = random.randint(1, 5)
            amount_dev = float(np.random.uniform(1.8, 5.0))
            device_anomaly = 0 # Victim used own phone
            ip_reputation = float(np.random.uniform(0.10, 0.40))
            geo_velocity = float(np.random.uniform(5, 40))
            fake_merchant = random.choice([m for m in MERCHANTS if m["trust"] < 0.20])
            merchant_trust = fake_merchant["trust"] + np.random.uniform(-0.02, 0.03)
            user_age = int(np.random.uniform(20, 600))
            community_flags = random.randint(3, 12) # Already flagged by multiple users
            failed_pins = 0

        else: # CROWDSOURCED_FRAUD_RING
            # Recipient UPI ID heavily reported in community fraud watchlist
            hour = random.randint(0, 23)
            amount = float(np.random.uniform(10000, 75000))
            txn_freq_1h = random.randint(3, 8)
            txn_freq_24h = random.randint(5, 14)
            amount_dev = float(np.random.uniform(3.5, 8.0))
            device_anomaly = 1 if random.random() < 0.6 else 0
            ip_reputation = float(np.random.uniform(0.55, 0.90))
            geo_velocity = float(np.random.uniform(50, 400))
            merchant_trust = 0.20
            user_age = int(np.random.uniform(5, 120))
            community_flags = random.randint(5, 20) # Massive community flags
            failed_pins = random.randint(1, 3)

        data.append({
            "amount": round(amount, 2),
            "hour_of_day": hour,
            "day_of_week": day_of_week,
            "txn_frequency_last_1h": txn_freq_1h,
            "txn_frequency_last_24h": txn_freq_24h,
            "amount_deviation_from_avg": round(amount_dev, 2),
            "device_fingerprint_anomaly": device_anomaly,
            "ip_reputation_score": round(ip_reputation, 3),
            "geo_velocity_kmph": round(geo_velocity, 1),
            "merchant_trust_score": round(max(0.0, min(1.0, merchant_trust)), 3),
            "is_p2p": is_p2p,
            "user_age_days": user_age,
            "community_flag_count": community_flags,
            "failed_pin_attempts_prior": failed_pins,
            "is_fraud": 1
        })

    df = pd.DataFrame(data)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df

if __name__ == "__main__":
    df = generate_upi_dataset(num_samples=15000, fraud_ratio=0.12)
    print(f"Generated {len(df)} UPI transactions.")
    print("Class distribution:")
    print(df["is_fraud"].value_counts(normalize=True))
    csv_path = "C:/Users/asish/.gemini/antigravity/scratch/upi-fraud-detection/backend/ml/upi_synthetic_dataset.csv"
    df.to_csv(csv_path, index=False)
    print(f"Dataset successfully saved to {csv_path}")
