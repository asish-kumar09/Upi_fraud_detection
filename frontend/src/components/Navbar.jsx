import React from "react";
import { 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Database, 
  MapPin, 
  Users, 
  FileCheck, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun,
  Globe
} from "lucide-react";

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  language, 
  setLanguage, 
  soundEnabled, 
  setSoundEnabled, 
  darkMode, 
  setDarkMode,
  t 
}) {
  const tabs = [
    { id: "monitor", label: t.navMonitor, icon: Activity },
    { id: "simulator", label: t.navSimulator, icon: Cpu },
    { id: "blockchain", label: t.navBlockchain, icon: Database },
    { id: "heatmap", label: t.navHeatmap, icon: MapPin },
    { id: "community", label: t.navCommunity, icon: Users },
    { id: "compliance", label: t.navCompliance, icon: FileCheck },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 border-slate-700/60 bg-slate-900/90 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("monitor")}>
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {t.appTitle}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t.liveStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Controls: Language, Sound, Theme */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Selector */}
            <div className="relative flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select language"
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="en" className="bg-slate-800 text-white">English (EN)</option>
                <option value="hi" className="bg-slate-800 text-white">हिंदी (HI)</option>
                <option value="od" className="bg-slate-800 text-white">ଓଡ଼ିଆ (OD)</option>
              </select>
            </div>

            {/* Sound Alerts Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? t.soundOn : t.soundOff}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled 
                  ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" 
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
