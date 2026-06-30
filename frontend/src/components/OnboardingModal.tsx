import React, { useState } from "react";
import { UserPrefs } from "../types";
import { Clock, Zap } from "lucide-react";

interface OnboardingModalProps {
  prefs: UserPrefs;
  onSave: (newPrefs: UserPrefs) => void;
  onClose?: () => void;
  isFirstLoad: boolean;
}

export default function OnboardingModal({ prefs, onSave, onClose, isFirstLoad }: OnboardingModalProps) {
  const [name, setName] = useState(prefs.name || "");
  const [startHour, setStartHour] = useState(prefs.workStartHour || "09:00");
  const [endHour, setEndHour] = useState(prefs.workEndHour || "18:00");
  const [energyPattern, setEnergyPattern] = useState(prefs.energyPattern || "morning");
  const [breakPreference, setBreakPreference] = useState(prefs.breakPreference || "standard");
  const [theme, setTheme] = useState<"cosmic" | "amberwood" | "nordic" | "retro" | "solar" | "stitch" | "aurora">(
    (prefs.theme as any) || "cosmic"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || "User",
      workStartHour: startHour,
      workEndHour: endHour,
      energyPattern,
      breakPreference,
      geminiApiKey: prefs.geminiApiKey,
      theme,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl glass-card animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent-indigo/20 text-accent-indigo">
                <Zap size={22} className="fill-current" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {isFirstLoad ? "Welcome to LastMinute AI" : "Companion Settings"}
                </h2>
                <p className="text-xs text-gray-400">Configure your productivity environment</p>
              </div>
            </div>
            {!isFirstLoad && onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">


            {/* PROFILE & TIME PREFERENCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-300">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-accent-indigo"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-gray-300">Energy Level Peak</label>
                <select
                  value={energyPattern}
                  onChange={(e) => setEnergyPattern(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-accent-indigo"
                >
                  <option value="morning">Morning Peak (08:00 - 12:00)</option>
                  <option value="afternoon">Afternoon Peak (12:00 - 17:00)</option>
                  <option value="evening">Evening Peak (17:00 - 22:00)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-300">Available Work Hours</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Clock size={12} className="absolute left-2.5 top-3 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Start (e.g. 09:00)"
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-full pl-7 pr-2 py-2 text-xs rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-accent-indigo"
                    />
                  </div>
                  <span className="text-gray-500 text-xs">to</span>
                  <div className="flex-1 relative">
                    <Clock size={12} className="absolute left-2.5 top-3 text-gray-500" />
                    <input
                      type="text"
                      placeholder="End (e.g. 18:00)"
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-full pl-7 pr-2 py-2 text-xs rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-accent-indigo"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-gray-300">Breaks Preference</label>
                <select
                  value={breakPreference}
                  onChange={(e) => setBreakPreference(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-accent-indigo"
                >
                  <option value="frequent">Frequent (10 mins every 45 mins)</option>
                  <option value="standard">Standard (10 mins every 90 mins)</option>
                  <option value="minimal">Minimal (15 mins every 180 mins)</option>
                </select>
              </div>
            </div>

            {/* THEME SELECTOR SECTION */}
            <div className="pt-2 border-t border-gray-800/60">
              <label className="block mb-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">Select Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                {[
                  {
                    id: "cosmic",
                    name: "Cosmic",
                    bg: "#0F0F13",
                    primary: "#6C63FF",
                    secondary: "#00D4AA",
                    label: "Midnight Neon",
                  },
                  {
                    id: "amberwood",
                    name: "Amber Wood",
                    bg: "#110F0D",
                    primary: "#D4AF37",
                    secondary: "#52D171",
                    label: "Warm Gold",
                  },
                  {
                    id: "nordic",
                    name: "Nordic",
                    bg: "#090D0C",
                    primary: "#40B5A6",
                    secondary: "#8BE99E",
                    label: "Forest Sage",
                  },
                  {
                    id: "retro",
                    name: "Retro",
                    bg: "#040404",
                    primary: "#FF9F0A",
                    secondary: "#00D4AA",
                    label: "Amber Term",
                  },
                  {
                    id: "solar",
                    name: "Solar",
                    bg: "#0A0A0E",
                    primary: "#FF3366",
                    secondary: "#00D4AA",
                    label: "Eclipse Red",
                  },
                  {
                    id: "stitch",
                    name: "Stitch",
                    bg: "#08090D",
                    primary: "#E28743",
                    secondary: "#FFC266",
                    label: "Bespoke Fiber",
                  },
                  {
                    id: "aurora",
                    name: "Aurora",
                    bg: "#f3f7f5",
                    primary: "#FF7A00",
                    secondary: "#00E676",
                    label: "Glass Light",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTheme(item.id as any);
                      // Apply theme immediately to document root for instant preview feedback!
                      const root = document.documentElement;
                      const bgVal = item.id === "cosmic" ? "#0F0F13" : item.id === "amberwood" ? "#110F0D" : item.id === "nordic" ? "#090D0C" : item.id === "retro" ? "#040404" : item.id === "solar" ? "#0A0A0E" : item.id === "stitch" ? "#08090D" : "#f3f7f5";
                      const cardVal = item.id === "cosmic" ? "#1A1A24" : item.id === "amberwood" ? "#1A1613" : item.id === "nordic" ? "#111816" : item.id === "retro" ? "#0C0C0C" : item.id === "solar" ? "#14141A" : item.id === "stitch" ? "#111422" : "#ffffff";
                      const primaryVal = item.id === "cosmic" ? "#6C63FF" : item.id === "amberwood" ? "#D4AF37" : item.id === "nordic" ? "#40B5A6" : item.id === "retro" ? "#FF9F0A" : item.id === "solar" ? "#FF3366" : item.id === "stitch" ? "#E28743" : "#FF7A00";
                      const mintVal = item.id === "cosmic" ? "#00D4AA" : item.id === "amberwood" ? "#52D171" : item.id === "nordic" ? "#8BE99E" : item.id === "retro" ? "#00D4AA" : item.id === "solar" ? "#00D4AA" : item.id === "stitch" ? "#FFC266" : "#00E676";
                      const redVal = item.id === "cosmic" ? "#FF4757" : item.id === "amberwood" ? "#E05D5D" : item.id === "nordic" ? "#FF6B81" : item.id === "retro" ? "#FF453A" : item.id === "solar" ? "#FF4757" : item.id === "stitch" ? "#E05D5D" : "#FF453A";
                      
                      root.style.setProperty("--theme-bg-dark", bgVal);
                      root.style.setProperty("--theme-card-dark", cardVal);
                      root.style.setProperty("--theme-accent-indigo", primaryVal);
                      root.style.setProperty("--theme-accent-mint", mintVal);
                      root.style.setProperty("--theme-accent-red", redVal);
                    }}
                    className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition cursor-pointer group ${
                      theme === item.id
                        ? "bg-gray-800/50 border-accent-indigo shadow-md"
                        : "bg-gray-950/20 border-gray-800/80 hover:border-gray-700/80 hover:bg-gray-800/30"
                    }`}
                  >
                    {/* Color Swatch Preview */}
                    <div
                      className="w-full h-7 rounded-lg mb-1 relative flex items-center justify-center overflow-hidden border border-white/5"
                      style={{ backgroundColor: item.bg }}
                    >
                      <div className="flex gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: item.primary }}
                        />
                        <span
                          className="w-2 h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: item.secondary }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white block truncate w-full">{item.name}</span>
                    <span className="text-[8px] text-gray-400 block truncate w-full group-hover:text-gray-300">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 mt-2 rounded-xl text-xs font-bold text-black bg-accent-indigo hover:bg-accent-indigo/95 transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-accent-indigo/10"
            >
              <Zap size={14} className="fill-current" />
              <span>{isFirstLoad ? "Initialize Productivity Deck" : "Save Changes"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
