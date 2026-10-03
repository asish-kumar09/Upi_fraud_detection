import React, { useState, useEffect } from "react";
import { MapPin, AlertTriangle, ShieldCheck, Flame, Info } from "lucide-react";
import { fetchHeatmapData } from "../services/api";

export default function RiskHeatmap({ t }) {
  const [heatmap, setHeatmap] = useState({ nodes: [], high_risk_zones: [] });
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    fetchHeatmapData().then(data => {
      setHeatmap(data);
      if (data.nodes && data.nodes.length > 0) {
        setSelectedCity(data.nodes[0]);
      }
    });
  }, []);

  const getRiskColor = (level) => {
    switch (level) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "MODERATE":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <span>National UPI Fraud Risk Heatmap & Clustering</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Geospatial density analysis across Indian financial hubs and flagged cyber-crime hotspots
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">High Risk Hotspots:</span>
          {heatmap.high_risk_zones?.map((z, idx) => (
            <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {z}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nodes Grid */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-white">Monitored State & City Hubs</h4>
            <span className="text-xs text-slate-400">{heatmap.nodes?.length} Geographic Clusters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {heatmap.nodes?.map((node, idx) => {
              const isSelected = selectedCity?.city === node.city;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCity(node)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected 
                      ? "bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-500/10" 
                      : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center space-x-1.5">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>{node.city}</span>
                      </div>
                      <div className="text-xs text-slate-400">{node.state}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskColor(node.risk_level)}`}>
                      {node.risk_level}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/40">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Transactions:</span>
                      <span className="font-semibold text-slate-200">{node.txns_monitored.toLocaleString("en-IN")}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Frauds Flagged:</span>
                      <span className="font-semibold text-rose-400">{node.fraud_detected}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Hub Inspector Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          {selectedCity ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{selectedCity.city}</h4>
                  <p className="text-xs text-slate-400">{selectedCity.state} Region</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs text-slate-400 block">Risk Classification</span>
                  <div className="mt-1">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getRiskColor(selectedCity.risk_level)}`}>
                      {selectedCity.risk_level} RISK LEVEL
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs text-slate-400 block">Geographic Coordinates</span>
                  <div className="text-xs font-mono text-slate-200 mt-1">
                    Lat: {selectedCity.lat.toFixed(4)}° N, Lon: {selectedCity.lon.toFixed(4)}° E
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-xs text-slate-400 block">Fraud Attack Ratio</span>
                  <div className="text-base font-bold text-rose-400 mt-1">
                    {((selectedCity.fraud_detected / selectedCity.txns_monitored) * 100).toFixed(2)}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedCity.fraud_detected} detected out of {selectedCity.txns_monitored} transactions
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Geofencing Active</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Geo-velocity calculation actively monitors physical speeds between consecutive transactions initiated in this zone.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">
              Select a city or risk cluster to view detailed metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
