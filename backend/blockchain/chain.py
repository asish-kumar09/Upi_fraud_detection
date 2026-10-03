"""
Tamper-Proof Blockchain Ledger for UPI Transactions & Fraud Audits
"""

import time
import json
import os
from typing import List, Dict, Any, Optional
try:
    from .block import Block
except Exception:
    from blockchain.block import Block

class Blockchain:
    def __init__(self, persistence_file: Optional[str] = None):
        self.chain: List[Block] = []
        self.pending_transactions: List[Dict[str, Any]] = []
        self.difficulty = 2
        self.persistence_file = persistence_file or os.path.join(
            os.path.dirname(__file__), "..", "saved_models", "blockchain_ledger.json"
        )
        self.load_or_create_genesis()

    def create_genesis_block(self):
        genesis_block = Block(
            index=0,
            timestamp="2026-01-01T00:00:00Z",
            transactions=[{
                "txn_id": "GENESIS-0000000000",
                "sender": "NPCI_GENESIS_ROOT",
                "receiver": "NETWORK_RESERVE",
                "amount": 0.0,
                "status": "APPROVED",
                "risk_score": 0.0,
                "description": "UPI Fraud Guard Genesis Ledger Root"
            }],
            previous_hash="0" * 64,
            nonce=0
        )
        genesis_block.mine_block(self.difficulty)
        self.chain.append(genesis_block)
        self.save_chain()

    def get_latest_block(self) -> Block:
        return self.chain[-1]

    def add_transaction(self, txn_record: Dict[str, Any], immediate_mine: bool = False) -> Dict[str, Any]:
        """
        Appends transaction to pending pool. If immediate_mine is True (e.g. for flagged/blocked fraud)
        or if pending transactions reach batch threshold (>= 4), a new block is mined.
        """
        self.pending_transactions.append(txn_record)
        
        should_mine = immediate_mine or (len(self.pending_transactions) >= 4)
        mined_block = None
        if should_mine and len(self.pending_transactions) > 0:
            mined_block = self.mine_pending_transactions()
            
        return {
            "queued": True,
            "pending_count": len(self.pending_transactions),
            "mined_block": mined_block.to_dict() if mined_block else None
        }

    def mine_pending_transactions(self) -> Block:
        if not self.pending_transactions:
            return self.get_latest_block()
            
        new_block = Block(
            index=len(self.chain),
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            transactions=list(self.pending_transactions),
            previous_hash=self.get_latest_block().hash
        )
        new_block.mine_block(self.difficulty)
        self.chain.append(new_block)
        self.pending_transactions = []
        self.save_chain()
        return new_block

    def validate_chain(self) -> Dict[str, Any]:
        """
        Audits cryptographic integrity across all blocks.
        Verifies previous_hash pointer, recalculated Merkle root, and hash difficulty.
        """
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]

            # 1. Verify previous hash pointer
            if current.previous_hash != previous.hash:
                return {
                    "is_valid": False,
                    "tampered_block_index": current.index,
                    "reason": f"Block #{current.index} previous_hash does not match Block #{previous.index} actual hash",
                    "expected_prev": previous.hash,
                    "actual_prev": current.previous_hash
                }

            # 2. Verify Merkle root matches transactions
            recalculated_merkle = current.calculate_merkle_root(current.transactions)
            if current.merkle_root != recalculated_merkle:
                return {
                    "is_valid": False,
                    "tampered_block_index": current.index,
                    "reason": f"Block #{current.index} transaction payload tampered. Merkle root mismatch.",
                    "expected_merkle": recalculated_merkle,
                    "actual_merkle": current.merkle_root
                }

            # 3. Verify block hash calculation
            recalculated_hash = current.calculate_hash()
            if current.hash != recalculated_hash:
                return {
                    "is_valid": False,
                    "tampered_block_index": current.index,
                    "reason": f"Block #{current.index} header or nonce altered. Hash mismatch.",
                    "expected_hash": recalculated_hash,
                    "actual_hash": current.hash
                }

            # 4. Verify difficulty target
            target = "0" * self.difficulty
            if not current.hash.startswith(target):
                return {
                    "is_valid": False,
                    "tampered_block_index": current.index,
                    "reason": f"Block #{current.index} fails proof-of-work target.",
                }

        return {
            "is_valid": True,
            "total_blocks": len(self.chain),
            "total_transactions_logged": sum(len(b.transactions) for b in self.chain),
            "message": "Blockchain cryptographic integrity 100% verified. Zero tampering detected."
        }

    def tamper_block_for_demo(self, block_index: int, new_amount: float = 999999.0) -> Dict[str, Any]:
        """
        Intentionally alters a block's transaction payload to demonstrate tamper detection in the UI.
        """
        if block_index < 0 or block_index >= len(self.chain):
            return {"success": False, "error": "Invalid block index"}
            
        target_block = self.chain[block_index]
        if target_block.transactions:
            target_block.transactions[0]["amount"] = new_amount
            target_block.transactions[0]["status"] = "TAMPERED_FRAUD_BYPASS"
        self.save_chain()
        return {
            "success": True,
            "message": f"Block #{block_index} transactions maliciously modified! Run chain audit to detect.",
            "tampered_block": target_block.to_dict()
        }

    def restore_chain(self):
        """Clears memory and re-inits genesis block for a fresh clean state."""
        self.chain = []
        self.pending_transactions = []
        if os.path.exists(self.persistence_file):
            try:
                os.remove(self.persistence_file)
            except Exception:
                pass
        self.load_or_create_genesis()

    def save_chain(self):
        try:
            os.makedirs(os.path.dirname(self.persistence_file), exist_ok=True)
            data = [b.to_dict() for b in self.chain]
            with open(self.persistence_file, "w") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving blockchain: {e}")

    def load_or_create_genesis(self):
        if os.path.exists(self.persistence_file):
            try:
                with open(self.persistence_file, "r") as f:
                    data = json.load(f)
                if data and isinstance(data, list):
                    self.chain = []
                    for b_dict in data:
                        block = Block(
                            index=b_dict["index"],
                            timestamp=b_dict["timestamp"],
                            transactions=b_dict["transactions"],
                            previous_hash=b_dict["previous_hash"],
                            nonce=b_dict.get("nonce", 0)
                        )
                        block.merkle_root = b_dict.get("merkle_root", block.calculate_merkle_root(block.transactions))
                        block.hash = b_dict.get("hash", block.calculate_hash())
                        self.chain.append(block)
                    return
            except Exception as e:
                print(f"Error loading blockchain file: {e}")
        self.create_genesis_block()
