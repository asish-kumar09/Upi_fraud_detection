import React, { useState, useEffect } from "react";
import { Users, ThumbsUp, ThumbsDown, ShieldAlert, PlusCircle, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { fetchCommunityReports, submitCommunityReport, voteCommunityReport } from "../services/api";

export default function CommunityReports({ t }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newReport, setNewReport] = useState({
    target_vpa: "",
    target_phone: "",
    fraud_type: "PHISHING_OR_SCAM",
    description: "",
    reported_by: ""
  });
  const [successMsg, setSuccessMsg] = useState("");

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchCommunityReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleVote = async (reportId, isUpvote) => {
    try {
      const updated = await voteCommunityReport(reportId, isUpvote);
      setReports(reports.map(r => r.report_id === reportId ? updated : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReport.target_vpa || !newReport.description) return;
    try {
      const res = await submitCommunityReport(newReport);
      setReports([res, ...reports]);
      setShowSubmitModal(false);
      setNewReport({
        target_vpa: "",
        target_phone: "",
        fraud_type: "PHISHING_OR_SCAM",
        description: "",
        reported_by: ""
      });
      setSuccessMsg(t.submitSuccess);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>{t.communityReportsTitle}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Decentralized crowdsourced reporting • Community consensus validation • Real-time blacklist sync
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-cyan-500/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.communityReportModal}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Reports Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const isVerified = report.status === "VERIFIED_FRAUD";
          return (
            <div
              key={report.report_id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    isVerified 
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40" 
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}>
                    {isVerified ? t.verifiedFraud : t.underReview}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {report.report_id}
                  </span>
                </div>

                <div className="mb-2">
                  <div className="text-xs text-slate-400">Reported UPI VPA:</div>
                  <div className="text-sm font-bold text-rose-400 font-mono break-all">
                    {report.target_vpa}
                  </div>
                </div>

                {report.target_phone && report.target_phone !== "N/A" && (
                  <div className="mb-2 text-xs">
                    <span className="text-slate-400">Linked Mobile: </span>
                    <span className="font-mono text-slate-300">{report.target_phone}</span>
                  </div>
                )}

                <div className="mb-3">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-semibold uppercase tracking-wider mb-1">
                    {report.fraud_type?.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {report.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  By: {report.reported_by || "Anonymous"}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleVote(report.report_id, true)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition"
                    title="Confirm Fraud (Upvote)"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span className="font-mono font-bold">{report.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleVote(report.report_id, false)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 transition"
                    title="Dispute (Downvote)"
                  >
                    <ThumbsDown className="w-3 h-3" />
                    <span className="font-mono">{report.downvotes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Report Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <span>{t.communityReportModal}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Help protect millions of Indian UPI users by crowdsourcing suspected fraudsters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target UPI ID / VPA *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. scammersupport@okhdfcbank"
                  value={newReport.target_vpa}
                  onChange={(e) => setNewReport({ ...newReport, target_vpa: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Associated Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98XXX XXXXX"
                  value={newReport.target_phone}
                  onChange={(e) => setNewReport({ ...newReport, target_phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fraud Category</label>
                <select
                  value={newReport.fraud_type}
                  onChange={(e) => setNewReport({ ...newReport, fraud_type: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="LOTTERY_PHISHING">Lottery / Cash Reward Phishing</option>
                  <option value="PART_TIME_JOB_SCAM">Part-Time Telegram Job Scam</option>
                  <option value="FAKE_BANK_SUPPORT">Fake Bank / KYC Verification Support</option>
                  <option value="SIM_SWAP_UNAUTHORIZED">Unauthorized Account Takeover</option>
                  <option value="TAMPERED_QR_CODE">Altered / Fake Merchant QR</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Details / Evidence *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what occurred, how the request was sent, and any message content..."
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Your Name / Handle (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Anonymous Citizen or your name"
                  value={newReport.reported_by}
                  onChange={(e) => setNewReport({ ...newReport, reported_by: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/20"
                >
                  {t.communitySubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
