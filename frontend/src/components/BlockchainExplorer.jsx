import React, { useState, useEffect } from "react";
import { 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Link, 
  Lock, 
  CheckCircle2, 
  AlertOctagon,
  FileCode
} from "lucide-react";
import { fetchBlockchain, verifyBlockchain, tamperBlockchain, resetBlockchain } from "../services/api";

export default function BlockchainExplorer({ t }) {
  const [chainData, setChainData] = useState({ blocks: [], pending_pool: [] });
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [auditing, setAuditing] = useState(false);
  const [tampering, setTampering] = useState(false);

  const loadChain = async () => {
    setLoading(true);
    try {
      const data = await fetchBlockchain();
      setChainData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChain();
  }, []);

  const handleAudit = async () => {
    setAuditing(true);
    try {
      const res = await verifyBlockchain();
      setAuditResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditing(false);
    }
  };

  const handleTamperDemo = async () => {
    if (chainData.blocks.length <= 1) {
      alert("At least 2 blocks are needed to demonstrate tampering. Please stream some transactions first!");
      return;
    }
    setTampering(true);
    try {
      await tamperBlockchain(1, 999999.0);
      await loadChain();
      setAuditResult(null);
    } catch (err) {
      console.error(err);
    } finally {
      setTampering(false);
    }
  };

  const handleReset = async () => {
    await resetBlockchain();
    setAuditResult(null);
    await loadChain();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <span>Immutable Blockchain Transaction Ledger</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic SHA-256 blocks • Merkle tree roots • Proof-of-Work tamper detection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAudit}
            disabled={auditing}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 transition"
          >
            {auditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            <span>{t.chainVerify}</span>
          </button>

          <button
            onClick={handleTamperDemo}
            disabled={tampering}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.chainTamperDemo}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {t.chainReset}
          </button>

          <button
            onClick={loadChain}
            title="Refresh Ledger"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Audit Result Alert Banner (if audited) */}
      {auditResult && (
        <div className={`p-4 rounded-2xl border animate-fade-in ${
          auditResult.is_valid 
            ? "bg-emerald-950/40 border-emerald-800 text-emerald-200" 
            : "bg-rose-950/40 border-rose-800 text-rose-200"
        }`}>
          <div className="flex items-start space-x-3">
            {auditResult.is_valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertOctagon className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm">
                {auditResult.is_valid ? "Cryptographic Chain Audit: VERIFIED 100% INTACT" : "TAMPERING DETECTED BY CRYPTOGRAPHIC AUDIT!"}
              </div>
              <p className="text-xs mt-1 text-slate-300">
                {auditResult.is_valid ? auditResult.message : auditResult.reason}
              </p>
              {!auditResult.is_valid && (
                <div className="mt-2 text-xs font-mono bg-rose-950/60 p-2 rounded-lg border border-rose-800/60">
                  <div>Tampered Block: #{auditResult.tampered_block_index}</div>
                  {auditResult.expected_prev && <div>Expected Prev: {auditResult.expected_prev}</div>}
                  {auditResult.actual_prev && <div>Actual Prev: {auditResult.actual_prev}</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blocks Visualization Feed */}
      <div className="space-y-4">
        {chainData.blocks.map((block, idx) => (
          <div 
            key={block.index} 
            className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg hover:border-slate-700 transition"
          >
            {/* Block Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Block #{block.index}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {block.timestamp}
                </span>
                {block.index === 0 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    GENESIS
                  </span>
                )}
              </div>
              
              <div className="text-xs text-slate-400 font-mono">
                Nonce: <span className="text-white font-bold">{block.nonce}</span> • Txns: <span className="text-white font-bold">{block.transactions_count}</span>
              </div>
            </div>

            {/* Block Hashes Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">Block Hash (SHA-256):</span>
                <span className="text-cyan-400 break-all">{block.hash}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-0.5">Previous Hash:</span>
                <span className="text-slate-300 break-all">{block.previous_hash}</span>
              </div>
            </div>

            {/* Merkle Root */}
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs font-mono mb-3">
              <span className="text-slate-400 text-[10px] uppercase font-semibold mr-2">Merkle Root:</span>
              <span className="text-purple-400 break-all">{block.merkle_root}</span>
            </div>

            {/* Transactions In Block */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Transactions in Block ({block.transactions?.length || 0}):
              </div>
              <div className="divide-y divide-slate-800/60 rounded-xl bg-slate-950/60 border border-slate-800/80 max-h-40 overflow-y-auto">
                {block.transactions?.map((tx, tIdx) => (
                  <div key={tIdx} className="p-2.5 text-xs flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-400">{tx.txn_id}</span>
                      <span className="text-slate-300 font-semibold">{tx.sender} → {tx.receiver}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-white">₹{tx.amount?.toLocaleString("en-IN")}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        tx.action === "BLOCKED" 
                          ? "bg-rose-500/20 text-rose-400" 
                          : (tx.action === "FLAGGED_REVIEW" 
                              ? "bg-amber-500/20 text-amber-400" 
                              : "bg-emerald-500/20 text-emerald-400")
                      }`}>
                        {tx.action || tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
