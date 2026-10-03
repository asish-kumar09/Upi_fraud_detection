import React, { useState } from "react";
import { Cpu, Send, ShieldAlert, CheckCircle, ArrowRight, RefreshCw, Zap } from "lucide-react";
import { evaluateCustomTransaction } from "../services/api";

export default function SimulatorModal({ onSelectTxnForExplain, t }) {
  const [formData, setFormData] = useState({
    sender_vpa: "rohan.sharma@okhdfcbank",
    receiver_vpa: "swiggy@icici",
    amount: 1250.0,
    hour_of_day: 14,
    day_of_week: 2,
    txn_frequency_last_1h: 1,
    txn_frequency_last_24h: 3,
    amount_deviation_from_avg: 1.1,
    device_fingerprint_anomaly: 0,
    ip_reputation_score: 0.05,
    geo_velocity_kmph: 15.0,
    merchant_trust_score: 0.95,
    is_p2p: 0,
    user_age_days: 420,
    community_flag_count: 0,
    failed_pin_attempts_prior: 0
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const applyPreset = (presetName) => {
    if (presetName === "LEGITIMATE") {
      setFormData({
        sender_vpa: "priya.patel@okaxis",
        receiver_vpa: "amazonpay@axis",
        amount: 850.0,
        hour_of_day: 15,
        day_of_week: 3,
        txn_frequency_last_1h: 1,
        txn_frequency_last_24h: 2,
        amount_deviation_from_avg: 1.0,
        device_fingerprint_anomaly: 0,
        ip_reputation_score: 0.02,
        geo_velocity_kmph: 12.0,
        merchant_trust_score: 0.98,
        is_p2p: 0,
        user_age_days: 520,
        community_flag_count: 0,
        failed_pin_attempts_prior: 0
      });
    } else if (presetName === "SIM_SWAP") {
      setFormData({
        sender_vpa: "deepak.verma@sbi",
        receiver_vpa: "muleroot99@paytm",
        amount: 85000.0,
        hour_of_day: 3, // 3 AM
        day_of_week: 1,
        txn_frequency_last_1h: 3,
        txn_frequency_last_24h: 4,
        amount_deviation_from_avg: 8.5,
        device_fingerprint_anomaly: 1, // New unknown device
        ip_reputation_score: 0.85,
        geo_velocity_kmph: 45.0,
        merchant_trust_score: 0.20,
        is_p2p: 1,
        user_age_days: 210,
        community_flag_count: 1,
        failed_pin_attempts_prior: 3 // Failed PINs
      });
    } else if (presetName === "IMPOSSIBLE_TRAVEL") {
      setFormData({
        sender_vpa: "amit.kumar@icici",
        receiver_vpa: "cashquick@okhdfcbank",
        amount: 42000.0,
        hour_of_day: 12,
        day_of_week: 4,
        txn_frequency_last_1h: 3,
        txn_frequency_last_24h: 5,
        amount_deviation_from_avg: 4.2,
        device_fingerprint_anomaly: 1,
        ip_reputation_score: 0.65,
        geo_velocity_kmph: 950.0, // Mumbai to Delhi in 15 mins
        merchant_trust_score: 0.40,
        is_p2p: 1,
        user_age_days: 350,
        community_flag_count: 0,
        failed_pin_attempts_prior: 0
      });
    } else if (presetName === "VELOCITY_ATTACK") {
      setFormData({
        sender_vpa: "rahul.mishra@paytm",
        receiver_vpa: "rapidmule@ybl",
        amount: 15000.0,
        hour_of_day: 19,
        day_of_week: 5,
        txn_frequency_last_1h: 12, // 12 txns in 1 hour
        txn_frequency_last_24h: 18,
        amount_deviation_from_avg: 5.0,
        device_fingerprint_anomaly: 0,
        ip_reputation_score: 0.45,
        geo_velocity_kmph: 30.0,
        merchant_trust_score: 0.30,
        is_p2p: 1,
        user_age_days: 60,
        community_flag_count: 2,
        failed_pin_attempts_prior: 1
      });
    } else if (presetName === "COMMUNITY_BLACKLIST") {
      setFormData({
        sender_vpa: "sneha.reddy@okaxis",
        receiver_vpa: "luckyprize@ybl", // Known blacklisted recipient
        amount: 25000.0,
        hour_of_day: 11,
        day_of_week: 6,
        txn_frequency_last_1h: 2,
        txn_frequency_last_24h: 4,
        amount_deviation_from_avg: 3.0,
        device_fingerprint_anomaly: 0,
        ip_reputation_score: 0.70,
        geo_velocity_kmph: 20.0,
        merchant_trust_score: 0.10,
        is_p2p: 0,
        user_age_days: 180,
        community_flag_count: 14,
        failed_pin_attempts_prior: 0
      });
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await evaluateCustomTransaction(formData);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Buttons Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-bold text-white">Load Attack Preset:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset("LEGITIMATE")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40 transition"
          >
            Legitimate Purchase
          </button>
          <button
            type="button"
            onClick={() => applyPreset("SIM_SWAP")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40 transition"
          >
            SIM Swap Takeover
          </button>
          <button
            type="button"
            onClick={() => applyPreset("IMPOSSIBLE_TRAVEL")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600/40 transition"
          >
            Impossible Travel (950 km/h)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("VELOCITY_ATTACK")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/40 transition"
          >
            Velocity Burst Drain
          </button>
          <button
            type="button"
            onClick={() => applyPreset("COMMUNITY_BLACKLIST")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/20 text-red-300 border border-red-500/40 hover:bg-red-600/40 transition"
          >
            Blacklisted Recipient VPA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
          <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Interactive UPI Transaction Evaluator</span>
          </h3>

          <form onSubmit={handleEvaluate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Sender UPI ID (VPA)</label>
                <input
                  type="text"
                  value={formData.sender_vpa}
                  onChange={(e) => setFormData({ ...formData, sender_vpa: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Receiver UPI ID (VPA)</label>
                <input
                  type="text"
                  value={formData.receiver_vpa}
                  onChange={(e) => setFormData({ ...formData, receiver_vpa: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Transaction Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Amount Deviation from Avg Ratio</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.amount_deviation_from_avg}
                  onChange={(e) => setFormData({ ...formData, amount_deviation_from_avg: parseFloat(e.target.value) || 1.0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Time of Day (Hour: 0 - 23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.hour_of_day}
                  onChange={(e) => setFormData({ ...formData, hour_of_day: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Txn Frequency (Last 1 Hour)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.txn_frequency_last_1h}
                  onChange={(e) => setFormData({ ...formData, txn_frequency_last_1h: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Geo-Velocity (km/h between txns)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.geo_velocity_kmph}
                  onChange={(e) => setFormData({ ...formData, geo_velocity_kmph: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Device Fingerprint Anomaly</label>
                <select
                  value={formData.device_fingerprint_anomaly}
                  onChange={(e) => setFormData({ ...formData, device_fingerprint_anomaly: parseInt(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={0}>0 - Known Registered Device</option>
                  <option value={1}>1 - New Unknown Device / Emulator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prior Failed PIN Attempts</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.failed_pin_attempts_prior}
                  onChange={(e) => setFormData({ ...formData, failed_pin_attempts_prior: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Merchant Trust Index (0.0 to 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.merchant_trust_score}
                  onChange={(e) => setFormData({ ...formData, merchant_trust_score: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition flex items-center justify-center space-x-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{loading ? "Evaluating with ML Ensemble..." : "Evaluate Fraud Risk & Explain Decision"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Verdict Output Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
              Real-Time Scoring Result
            </h3>

            {result ? (
              <div className="space-y-4 animate-fade-in">
                {/* Score Gauge Box */}
                <div className={`p-4 rounded-2xl border text-center ${
                  result.risk_score >= 0.75 
                    ? "bg-rose-950/40 border-rose-800 text-rose-300"
                    : (result.risk_score >= 0.45 
                        ? "bg-amber-950/40 border-amber-800 text-amber-300" 
                        : "bg-emerald-950/40 border-emerald-800 text-emerald-300")
                }`}>
                  <div className="text-3xl font-extrabold mb-1">
                    {result.risk_percentage}%
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    {result.action} • {result.severity} RISK
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Evaluated in <span className="font-mono text-cyan-400">{result.latency_ms} ms</span>
                  </div>
                </div>

                {/* Explanation Snippet */}
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200">
                  <div className="font-semibold text-slate-400 mb-1">AI Explanation:</div>
                  <p>{result.explainability?.explanations?.en}</p>
                </div>

                {/* Violations */}
                {result.rule_triggers && result.rule_triggers.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                    <div className="font-bold">Violations Detected:</div>
                    {result.rule_triggers.map((r, i) => (
                      <div key={i} className="text-[11px]">• {r}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                Select an attack preset or enter custom transaction parameters, then click Evaluate.
              </div>
            )}
          </div>

          {result && (
            <div className="pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => onSelectTxnForExplain(result)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-semibold text-xs transition flex items-center justify-center space-x-1.5"
              >
                <span>Open Full SHAP Attribution Waterfall</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
