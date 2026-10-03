"""
Cryptographic Block Representation for UPI Tamper-Proof Audit Trail
"""

import hashlib
import json
from typing import List, Dict, Any

class Block:
    def __init__(self, index: int, timestamp: str, transactions: List[Dict[str, Any]], previous_hash: str, nonce: int = 0):
        self.index = index
        self.timestamp = timestamp
        self.transactions = transactions
        self.previous_hash = previous_hash
        self.nonce = nonce
        self.merkle_root = self.calculate_merkle_root(transactions)
        self.hash = self.calculate_hash()

    def calculate_merkle_root(self, transactions: List[Dict[str, Any]]) -> str:
        if not transactions:
            return hashlib.sha256(b"empty_transactions").hexdigest()
        
        # Calculate leaf hashes
        tx_hashes = [
            hashlib.sha256(json.dumps(tx, sort_keys=True).encode("utf-8")).hexdigest()
            for tx in transactions
        ]
        
        while len(tx_hashes) > 1:
            if len(tx_hashes) % 2 != 0:
                tx_hashes.append(tx_hashes[-1])
            new_hashes = []
            for i in range(0, len(tx_hashes), 2):
                combined = tx_hashes[i] + tx_hashes[i + 1]
                new_hashes.append(hashlib.sha256(combined.encode("utf-8")).hexdigest())
            tx_hashes = new_hashes
            
        return tx_hashes[0]

    def calculate_hash(self) -> str:
        block_string = (
            f"{self.index}"
            f"{self.timestamp}"
            f"{self.merkle_root}"
            f"{self.previous_hash}"
            f"{self.nonce}"
        )
        return hashlib.sha256(block_string.encode("utf-8")).hexdigest()

    def mine_block(self, difficulty: int = 2):
        target = "0" * difficulty
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.calculate_hash()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "transactions_count": len(self.transactions),
            "transactions": self.transactions,
            "merkle_root": self.merkle_root,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce,
            "hash": self.hash
        }
