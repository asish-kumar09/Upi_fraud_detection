import React, { useState, useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import LiveMonitor from "./components/LiveMonitor";
import SimulatorModal from "./components/SimulatorModal";
import BlockchainExplorer from "./components/BlockchainExplorer";
import RiskHeatmap from "./components/RiskHeatmap";
import CommunityReports from "./components/CommunityReports";
import PerformanceMetrics from "./components/PerformanceMetrics";
import ExplainableModal from "./components/ExplainableModal";
import { translations } from "./i18n/translations";
import { fetchStreamHistory, fetchNextTransaction, fetchMetrics } from "./services/api";
import { playSecurityAlertSound, playApprovedPing } from "./services/sound";

export default function App() {
  const [activeTab, setActiveTab] = useState("monitor");
  const [language, setLanguage] = useState("en");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [isStreaming, setIsStreaming] = useState(true);
  const [streamIntervalMs, setStreamIntervalMs] = useState(2500);
  const [metrics, setMetrics] = useState(null);
  const [selectedTxnForExplain, setSelectedTxnForExplain] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const t = translations[language] || translations.en;
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;

  // Initial load
  useEffect(() => {
    fetchStreamHistory(30)
      .then(data => setTransactions(data))
      .catch(err => {
        console.error("API connection failed:", err);
        setErrorMsg("Connecting to UPI Fraud Detection Backend at http://localhost:8000...");
      });

    fetchMetrics()
      .then(m => setMetrics(m))
      .catch(() => {});
  }, []);

  // Continuous streaming loop
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(async () => {
      if (!isStreamingRef.current) return;
      try {
        const nextTx = await fetchNextTransaction();
        if (nextTx && nextTx.txn_id) {
          setTransactions(prev => [nextTx, ...prev.slice(0, 49)]);
          setErrorMsg("");

          // Sound alert trigger
          if (soundEnabled) {
            if (nextTx.action === "BLOCKED" || nextTx.severity === "CRITICAL" || nextTx.severity === "HIGH") {
              playSecurityAlertSound();
            }
          }
        }
      } catch (err) {
        // Backend might still be starting or stream paused
      }
    }, streamIntervalMs);

    return () => clearInterval(interval);
  }, [isStreaming, streamIntervalMs, soundEnabled]);

  const handleTriggerNext = async (scenario = null) => {
    try {
      const nextTx = await fetchNextTransaction(scenario);
      if (nextTx && nextTx.txn_id) {
        setTransactions(prev => [nextTx, ...prev.slice(0, 49)]);
        if (soundEnabled && (nextTx.action === "BLOCKED" || nextTx.severity === "CRITICAL")) {
          playSecurityAlertSound();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-900 text-slate-100"} font-sans antialiased selection:bg-cyan-500 selection:text-white`}>
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        t={t}
      />

      {/* Backend connection banner if unreachable */}
      {errorMsg && (
        <div className="bg-amber-950/80 border-b border-amber-800 text-amber-200 px-4 py-2 text-xs text-center">
          {errorMsg} (Ensure FastAPI backend is running on port 8000)
        </div>
      )}

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "monitor" && (
          <LiveMonitor
            transactions={transactions}
            isStreaming={isStreaming}
            setIsStreaming={setIsStreaming}
            streamIntervalMs={streamIntervalMs}
            setStreamIntervalMs={setStreamIntervalMs}
            onTriggerNext={handleTriggerNext}
            onSelectTxnForExplain={setSelectedTxnForExplain}
            metrics={metrics}
            t={t}
          />
        )}

        {activeTab === "simulator" && (
          <SimulatorModal
            onSelectTxnForExplain={setSelectedTxnForExplain}
            t={t}
          />
        )}

        {activeTab === "blockchain" && (
          <BlockchainExplorer
            t={t}
          />
        )}

        {activeTab === "heatmap" && (
          <RiskHeatmap
            t={t}
          />
        )}

        {activeTab === "community" && (
          <CommunityReports
            t={t}
          />
        )}

        {activeTab === "compliance" && (
          <PerformanceMetrics
            metrics={metrics}
            t={t}
          />
        )}
      </main>

      {/* Explainable AI Modal */}
      {selectedTxnForExplain && (
        <ExplainableModal
          txn={selectedTxnForExplain}
          onClose={() => setSelectedTxnForExplain(null)}
          language={language}
          t={t}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">UPI Fraud Shield AI</span>
            <span>•</span>
            <span>Multi-Layer ML Ensemble + Proof-of-Work Blockchain</span>
          </div>
          <div>
            <span>RBI Master Directions Compliant • DPDP Act 2023 Masking • Sub-200ms Latency</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
