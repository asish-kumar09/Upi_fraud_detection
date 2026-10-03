import React from "react";
import { X, AlertTriangle, ShieldCheck, Cpu, ArrowRight, CheckCircle2, AlertOctagon } from "lucide-react";

export default function ExplainableModal({ txn, onClose, language = "en", t }) {
  if (!txn) return null;

  const exp = txn.explainability || {};
  const narrative = exp.explanations?.[language] || exp.explanations?.en || "No explanation available.";
  const topRisks = exp.top_risk_drivers || [];
  const topSafes = exp.top_mitigating_factors || [];
  const allShap = exp.shap_breakdown || [];

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  const getActionBadge = (action) => {
    if (action === "BLOCKED") {
      return { text: t.actionBlocked, color: "bg-rose-600 text-white" };
    }
    if (action === "FLAGGED_REVIEW") {
      return { text: t.actionFlagged, color: "bg-amber-600 text-white" };
    }
    return { text: t.actionApproved, color: "bg-emerald-600 text-white" };
  };

  const actionInfo = getActionBadge(txn.action);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>{t.explainModalTitle}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getSeverityBadge(txn.severity)}`}>
                  {txn.severity}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {t.explainModalSubtitle} • Txn ID: <span className="text-slate-300 font-mono">{txn.txn_id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">Amount</span>
            <div className="text-lg font-bold text-white">₹{txn.amount?.toLocaleString("en-IN")}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">ML Risk Score</span>
            <div className={`text-lg font-bold ${txn.risk_score >= 0.5 ? "text-rose-400" : "text-emerald-400"}`}>
              {txn.risk_percentage}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">Inference Latency</span>
            <div className="text-lg font-bold text-cyan-400">{txn.latency_ms} ms</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">Decision</span>
            <div className="mt-1">
              <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${actionInfo.color}`}>
                {actionInfo.text}
              </span>
            </div>
          </div>
        </div>

        {/* Natural Language Synthesis Alert */}
        <div className={`p-4 rounded-xl mb-6 border ${txn.risk_score >= 0.5 ? "bg-rose-950/30 border-rose-800/50" : "bg-emerald-950/30 border-emerald-800/50"}`}>
          <div className="flex items-start space-x-3">
            {txn.risk_score >= 0.5 ? (
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                AI Narrative ({language.toUpperCase()})
              </div>
              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                {narrative}
              </p>
            </div>
          </div>
        </div>

        {/* Heuristic Rule Triggers (if any) */}
        {txn.rule_triggers && txn.rule_triggers.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Safety Rule Violations</span>
            </h4>
            <div className="space-y-1.5">
              {txn.rule_triggers.map((rule, idx) => (
                <div key={idx} className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHAP Feature Attribution Waterfall Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>SHAP Feature Attribution (Local Waterfall)</span>
              <span className="text-xs font-normal text-slate-400">Values &gt; 0 push towards Fraud</span>
            </h4>
          </div>

          <div className="space-y-2.5">
            {allShap.map((item, idx) => {
              const isPositive = item.shap_impact > 0;
              const absVal = Math.min(100, Math.abs(item.shap_impact) * 200);
              const label = language === "hi" ? item.label_hi : (language === "od" ? item.label_od : item.label_en);

              return (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-slate-200">
                      {label}
                      <span className="ml-2 font-mono text-slate-400">
                        (val: {typeof item.feature_value === "number" ? item.feature_value.toFixed(1) : item.feature_value})
                      </span>
                    </span>
                    <span className={`font-mono font-bold ${isPositive ? "text-rose-400" : "text-emerald-400"}`}>
                      {isPositive ? `+${item.shap_impact}` : item.shap_impact}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden flex">
                    {isPositive ? (
                      <div
                        className="bg-gradient-to-r from-rose-500 to-red-400 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(6, absVal)}%` }}
                      ></div>
                    ) : (
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(6, absVal)}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
