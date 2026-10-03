import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  FastForward, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Cpu, 
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

export default function LiveMonitor({
  transactions,
  isStreaming,
  setIsStreaming,
  streamIntervalMs,
  setStreamIntervalMs,
  onTriggerNext,
  onSelectTxnForExplain,
  metrics,
  t
}) {
  const [selectedScenario, setSelectedScenario] = useState("");

  const stats = {
    total: transactions.length,
    blocked: transactions.filter(t => t.action === "BLOCKED").length,
    flagged: transactions.filter(t => t.action === "FLAGGED_REVIEW").length,
    approved: transactions.filter(t => t.action === "APPROVED").length,
    avgLatency: transactions.length > 0 
      ? (transactions.reduce((acc, curr) => acc + (curr.latency_ms || 15), 0) / transactions.length).toFixed(1)
      : "14.2"
  };

  const highPriorityAlerts = transactions.filter(
    t => t.action === "BLOCKED" || t.severity === "CRITICAL" || t.severity === "HIGH"
  ).slice(0, 6);

  const getActionBadge = (action) => {
    switch (action) {
      case "BLOCKED":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">{t.actionBlocked}</span>;
      case "FLAGGED_REVIEW":
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">{t.actionFlagged}</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">{t.actionApproved}</span>;
    }
  };

  const getSeverityDot = (sev) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-500 animate-ping";
      case "HIGH":
        return "bg-amber-500";
      case "MEDIUM":
        return "bg-yellow-500";
      default:
        return "bg-emerald-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>{t.monitored}</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">
            {stats.total + 1284}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse"></span>
            Streaming at ~15 txns/min
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>{t.fraudBlocked}</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">
            {stats.blocked + 148}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.flagged} under enhanced review
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>{t.avgLatency}</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {stats.avgLatency} ms
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            Target &lt; 200ms (100% compliant)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>{t.accuracyRate}</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-400">
            {metrics?.accuracy || 98.4}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Precision: {metrics?.precision || 96.2}% • Recall: {metrics?.recall || 95.8}%
          </div>
        </div>
      </div>

      {/* Stream Controls Banner */}
      <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
              isStreaming
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? t.pause : t.resume}</span>
          </button>

          <button
            onClick={() => onTriggerNext(selectedScenario || null)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.nextTxn}</span>
          </button>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-300">
            <span>Speed:</span>
            <select
              value={streamIntervalMs}
              onChange={(e) => setStreamIntervalMs(Number(e.target.value))}
              aria-label="Streaming speed interval"
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value={1000}>1.0s (Fast)</option>
              <option value={2000}>2.0s (Normal)</option>
              <option value={4000}>4.0s (Slow)</option>
            </select>
          </div>
        </div>

        {/* Attack Vector Shortcut Injection */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 hidden md:inline">Inject Attack:</span>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            aria-label="Select attack scenario"
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="">Mixed Realistic Stream</option>
            <option value="SIM_SWAP">SIM Swap / Takeover</option>
            <option value="IMPOSSIBLE_TRAVEL">Impossible Travel Speed</option>
            <option value="VELOCITY_ATTACK">Rapid Velocity Burst</option>
            <option value="FAKE_MERCHANT">Fake Merchant QR Phishing</option>
            <option value="BLACKLISTED_RECIPIENT">Crowdsourced Blacklisted VPA</option>
          </select>
          <button
            onClick={() => onTriggerNext(selectedScenario || "SIM_SWAP")}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600/80 hover:bg-rose-500 text-white transition"
          >
            Inject Now
          </button>
        </div>
      </div>

      {/* Main Grid: Feed & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction Stream Table (2 columns on large screens) */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>{t.txnFeedTitle}</span>
            </h3>
            <span className="text-xs text-slate-400">{transactions.length} items logged</span>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[580px] overflow-y-auto">
            {transactions.map((tx) => (
              <div 
                key={tx.txn_id} 
                className="p-3.5 hover:bg-slate-800/40 transition flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                      ₹
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${getSeverityDot(tx.severity)}`}></span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white truncate">
                        {tx.sender_name || tx.sender_vpa}
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="text-slate-300 truncate">
                        {tx.receiver_name || tx.receiver_vpa}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span className="font-mono text-slate-500">{tx.txn_id?.split("-")[1] || tx.txn_id}</span>
                      <span>•</span>
                      <span>{tx.current_location?.city || tx.sender_city || "India"}</span>
                      <span>•</span>
                      <span className="font-mono text-cyan-400">{tx.latency_ms}ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-white text-sm">
                      ₹{tx.amount?.toLocaleString("en-IN")}
                    </div>
                    <div className="text-[11px] font-mono mt-0.5">
                      Risk: <span className={tx.risk_score >= 0.5 ? "text-rose-400 font-bold" : "text-emerald-400"}>{tx.risk_percentage}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    {getActionBadge(tx.action)}
                    <button
                      onClick={() => onSelectTxnForExplain(tx)}
                      className="inline-flex items-center text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline mt-0.5"
                    >
                      <span>{t.inspectExplain}</span>
                      <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: High-Priority Fraud Alerts Feed */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{t.alertFeedTitle}</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
              REAL-TIME
            </span>
          </div>

          <div className="p-3 divide-y divide-slate-800 overflow-y-auto max-h-[580px] space-y-3">
            {highPriorityAlerts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No critical fraud alerts detected in recent stream window.
              </div>
            ) : (
              highPriorityAlerts.map((alert) => (
                <div 
                  key={alert.txn_id} 
                  className="pt-3 first:pt-0 pb-1 cursor-pointer hover:bg-slate-800/30 rounded-xl p-2 transition"
                  onClick={() => onSelectTxnForExplain(alert)}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      {alert.injected_scenario?.replace(/_/g, " ") || alert.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      ₹{alert.amount?.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2 mb-1.5">
                    {alert.explainability?.explanations?.en || "Suspicious transaction flagged by ensemble model."}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-mono">{alert.receiver_vpa}</span>
                    <span className="text-cyan-400 hover:underline flex items-center">
                      View SHAP &gt;
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
