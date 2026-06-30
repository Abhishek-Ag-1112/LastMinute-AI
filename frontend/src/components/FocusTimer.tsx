import React, { useState, useEffect, useRef } from "react";
import { Task } from "../types";
import { Play, Pause, RotateCcw, Flame, Sparkles, BrainCircuit, Sliders, PlayCircle } from "lucide-react";

interface FocusTimerProps {
  tasks: Task[];
  onAddFocusSession: (mins: number, taskTitle: string) => void;
  apiKey?: string;
}

const QUOTES = [
  "Action cures fear. Procrastination feeds it. Pick your task and move now.",
  "You do not need to feel like doing it to do it. Action precedes motivation.",
  "Your future self is begging you to finish this task now.",
  "A year from now you may wish you had started today.",
  "Focus on the process, not the outcome. 25 minutes of deep presence is all it takes.",
];

export default function FocusTimer({ tasks, onAddFocusSession, apiKey }: FocusTimerProps) {
  // Timer settings & states
  const [workDuration, setWorkDuration] = useState(25); // in minutes
  const [shortBreakDuration, setShortBreakDuration] = useState(5); // in minutes
  const [longBreakDuration, setLongBreakDuration] = useState(15); // in minutes

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [quote, setQuote] = useState(QUOTES[0]);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);

  // Distraction prevention toggles
  const [doNotDisturb, setDoNotDisturb] = useState(true);
  const [alwaysOnDisplay, setAlwaysOnDisplay] = useState(false);

  // Navigation tab for smaller screens
  const [timerSubTab, setTimerSubTab] = useState<"timer" | "settings">("timer");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-link to the highest priority active task
  useEffect(() => {
    const activeTasks = tasks.filter((t) => !t.completed);
    if (activeTasks.length > 0) {
      const sorted = [...activeTasks].sort((a, b) => {
        if (a.aiPriorityRank && b.aiPriorityRank) {
          return a.aiPriorityRank - b.aiPriorityRank;
        }
        const priorityWeight = { high: 1, medium: 2, low: 3 };
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      });
      setSelectedTaskId(sorted[0].id);
    } else {
      setSelectedTaskId("");
    }
  }, [tasks]);

  // Adjust timeLeft when durations change and timer is NOT running
  useEffect(() => {
    if (!isRunning) {
      if (mode === "work") {
        setTimeLeft(workDuration * 60);
      } else {
        setTimeLeft(shortBreakDuration * 60);
      }
    }
  }, [workDuration, shortBreakDuration, mode, isRunning]);

  // Generate motivational quote when workspace session starts
  const fetchAiQuote = async () => {
    setIsGeneratingQuote(true);
    const linkedTask = tasks.find((t) => t.id === selectedTaskId);

    try {
      const res = await fetch("/api/gemini/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-api-key": apiKey || "",
        },
        body: JSON.stringify({
          task: linkedTask || { title: "General Productivity" },
          timeLeft: mode === "work" ? `${workDuration} minutes` : `${shortBreakDuration} minutes`,
          completionRate: 85,
          timeOfDay: "active session",
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.text) {
        setQuote(data.text);
      } else {
        throw new Error();
      }
    } catch {
      setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, mode]);

  const handleTimerComplete = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = mode === "work" ? 880 : 440;
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.log("Web Audio API blocked");
    }

    if (mode === "work") {
      const linkedTask = tasks.find((t) => t.id === selectedTaskId);
      onAddFocusSession(workDuration, linkedTask ? linkedTask.title : "Unlinked Session");
      alert("Deep Work Block Complete! Time to take a break.");
      setMode("break");
      setTimeLeft(shortBreakDuration * 60);
    } else {
      alert("Break complete! Ready to smash your goals again?");
      setMode("work");
      setTimeLeft(workDuration * 60);
    }
  };

  const toggleTimer = () => {
    if (!isRunning && timeLeft === workDuration * 60 && mode === "work") {
      fetchAiQuote();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "work" ? workDuration * 60 : shortBreakDuration * 60);
  };

  const skipTimer = () => {
    setIsRunning(false);
    if (mode === "work") {
      setMode("break");
      setTimeLeft(shortBreakDuration * 60);
    } else {
      setMode("work");
      setTimeLeft(workDuration * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    // Format minutes.seconds to replicate the gorgeous design aesthetic: 13.15
    return `${mins.toString().padStart(2, "0")}.${secs.toString().padStart(2, "0")}`;
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // SVG Circular progress values
  const totalSeconds = mode === "work" ? workDuration * 60 : shortBreakDuration * 60;
  const progressRatio = totalSeconds > 0 ? timeLeft / totalSeconds : 0;
  const strokeDash = 2 * Math.PI * 110;
  const strokeDashoffset = strokeDash * (1 - progressRatio);

  // Angle for the glowing handle dot
  const handleAngle = (1 - progressRatio) * 360 - 90; // offset by 90deg to start at top
  const handleX = 125 + 110 * Math.cos((handleAngle * Math.PI) / 180);
  const handleY = 125 + 110 * Math.sin((handleAngle * Math.PI) / 180);

  return (
    <div className="space-y-6">
      {/* Tab select header for small/med screens */}
      <div className="flex md:hidden items-center justify-center p-1 rounded-xl bg-gray-950/40 border border-emerald-500/10">
        <button
          onClick={() => setTimerSubTab("timer")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            timerSubTab === "timer"
              ? "bg-accent-mint text-black shadow-lg shadow-emerald-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Active Timer
        </button>
        <button
          onClick={() => setTimerSubTab("settings")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            timerSubTab === "settings"
              ? "bg-accent-mint text-black shadow-lg shadow-emerald-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Timer Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* ========================================================== */}
        {/* SCREEN 1: ACTIVE FOCUS TIMER PANEL                         */}
        {/* ========================================================== */}
        <div className={`space-y-6 ${timerSubTab !== "timer" ? "hidden md:block" : ""}`}>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Focus Progress</h1>
            <p className="text-xs text-gray-400 font-medium leading-tight">
              Hello, {tasks.length > 0 ? "Riley" : "Alex"}! Let's begin your focus session
            </p>
          </div>

          {/* Active linked task banner (top section) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 to-teal-950/25 border border-white/5 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-accent-mint border border-emerald-500/20">
                <Flame size={18} className="animate-pulse" />
              </div>
              <div className="max-w-[150px] sm:max-w-xs">
                <h4 className="text-xs font-bold text-white truncate">
                  {selectedTask ? selectedTask.title : "General Deep Work"}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                  {selectedTask ? `Category: ${selectedTask.category}` : "Ready to lock in"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono text-accent-mint font-bold block">
                {selectedTask ? "Active Task" : "Chamber Mode"}
              </span>
              <span className="text-[9px] text-gray-500 font-mono">
                {workDuration} minutes
              </span>
            </div>
          </div>

          {/* Main Ring Area Card */}
          <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px] border border-white/10 shadow-2xl">
            {/* Background glowing aurora blobs inside the timer card */}
            <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

            {/* Circular SVG Ring Progress Arc */}
            <div className="relative w-[250px] h-[250px] flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <defs>
                  {/* Linear gradient to replicate the elegant white-to-orange taper */}
                  <linearGradient id="auroraTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF7A00" />
                    <stop offset="50%" stopColor="#FFA800" />
                    <stop offset="100%" stopColor="#FFFFFF" />
                  </linearGradient>
                </defs>
                {/* Background track circle */}
                <circle
                  cx="125"
                  cy="125"
                  r="110"
                  className="text-gray-900/50"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Colored active progress circle */}
                <circle
                  cx="125"
                  cy="125"
                  r="110"
                  strokeWidth="10"
                  strokeDasharray={strokeDash}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  stroke="url(#auroraTimerGradient)"
                  fill="transparent"
                  className="transition-all duration-300 ease-out"
                />
              </svg>

              {/* Glowing handle dot at the active timer point */}
              <div
                className="absolute w-4 h-4 rounded-full bg-[#FF7A00] border-2 border-white shadow-[0_0_15px_#FF7A00] transition-all duration-300 ease-out pointer-events-none"
                style={{
                  left: `${handleX}px`,
                  top: `${handleY}px`,
                  transform: "translate(-50%, -50%)",
                }}
              />

              {/* Center digital values matching exact phone aesthetic */}
              <div className="text-center z-10 space-y-1.5">
                <div className="text-6xl font-black text-white tracking-tighter drop-shadow-md">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[11px] font-black tracking-widest text-gray-400 uppercase">
                  {isRunning ? "Running" : "Paused"}
                </div>
              </div>
            </div>

            {/* Focus status indicator pill */}
            <div className="mt-6">
              <span className="px-5 py-2 text-[11px] font-bold tracking-wide rounded-full bg-gray-950/80 text-gray-300 border border-white/5 shadow-inner">
                {mode === "work" ? `Stay focus for ${workDuration} min` : "Enjoy a quick rest"}
              </span>
            </div>

            {/* Micro Controls Capsule (Bottom Media Group) */}
            <div className="mt-8 px-6 py-3 rounded-full bg-emerald-950/30 backdrop-blur-xl border border-white/5 flex items-center justify-between gap-8 shadow-lg">
              <button
                onClick={resetTimer}
                className="p-2 rounded-full text-gray-400 hover:text-white transition-colors duration-200"
                title="Restart block"
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={toggleTimer}
                className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 transition-all duration-200 shadow-md shadow-emerald-500/20"
                title={isRunning ? "Pause" : "Play"}
              >
                {isRunning ? (
                  <Pause size={18} className="fill-current text-black" />
                ) : (
                  <Play size={18} className="fill-current text-black ml-0.5" />
                )}
              </button>

              <button
                onClick={skipTimer}
                className="p-2 rounded-full text-gray-400 hover:text-white transition-colors duration-200"
                title="Skip segment"
              >
                <PlayCircle size={16} />
              </button>
            </div>
          </div>

          {/* DYNAMIC AI PROMPT GUIDANCE CARD */}
          <div className="p-4 rounded-2xl bg-[#090F0C] border border-emerald-500/10 flex gap-3 relative overflow-hidden">
            <div className="absolute right-2 top-2 opacity-5">
              <Sparkles size={32} className="text-accent-mint" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-accent-mint flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </div>
            <div>
              <h5 className="text-[10px] font-bold text-accent-mint uppercase tracking-wider">AI Focus Companion</h5>
              <p className="text-[11px] text-gray-300 italic mt-1 leading-relaxed">
                "{quote}"
              </p>
              <button
                onClick={fetchAiQuote}
                disabled={isGeneratingQuote}
                className="text-[9px] font-mono font-bold text-[#FF7A00] uppercase tracking-wider mt-2 hover:underline inline-flex items-center gap-1"
              >
                {isGeneratingQuote ? "Scribing..." : "Get custom tip ✦"}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================== */}
        {/* SCREEN 2: TIMER SETTINGS PANEL                             */}
        {/* ========================================================== */}
        <div className={`space-y-6 ${timerSubTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Timer Settings</h1>
            <p className="text-xs text-gray-400 font-medium">Fine-tune focus blocks and silence alerts</p>
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                setWorkDuration(25);
                setShortBreakDuration(5);
                setLongBreakDuration(15);
                resetTimer();
              }}
              className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
                workDuration === 25
                  ? "bg-emerald-950/40 border-emerald-500/40 text-white shadow-xl shadow-emerald-950/20"
                  : "bg-gray-950/20 border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Select Task
              </span>
              <span className="text-2xl font-black block">25</span>
              <span className="text-[9px] text-gray-400 mt-1 block">minutes</span>
            </button>

            <button
              onClick={() => {
                setWorkDuration(45);
                setShortBreakDuration(10);
                setLongBreakDuration(20);
                resetTimer();
              }}
              className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
                workDuration === 45
                  ? "bg-emerald-950/40 border-emerald-500/40 text-white shadow-xl shadow-emerald-950/20"
                  : "bg-gray-950/20 border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Short Break
              </span>
              <span className="text-2xl font-black block">5</span>
              <span className="text-[9px] text-gray-400 mt-1 block">minutes</span>
            </button>

            <button
              onClick={() => {
                setWorkDuration(60);
                setShortBreakDuration(15);
                setLongBreakDuration(30);
                resetTimer();
              }}
              className={`p-4 rounded-2xl border text-center transition-all duration-200 ${
                workDuration === 60
                  ? "bg-emerald-950/40 border-emerald-500/40 text-white shadow-xl shadow-emerald-950/20"
                  : "bg-gray-950/20 border-white/5 text-gray-400 hover:text-white"
              }`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Long Break
              </span>
              <span className="text-2xl font-black block">15</span>
              <span className="text-[9px] text-gray-400 mt-1 block">minutes</span>
            </button>
          </div>

          {/* Premium Settings Cards List */}
          <div className="glass-card rounded-3xl p-6 space-y-6 border border-white/10 shadow-2xl">
            
            {/* Session Length Striped Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase text-gray-300">
                <span className="tracking-wider">Session length</span>
                <span className="text-[#FF7A00] font-mono font-bold">{workDuration} minutes</span>
              </div>
              
              {/* Textured Gradient Striped slider simulation */}
              <div className="relative pt-1">
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={workDuration}
                  onChange={(e) => {
                    setWorkDuration(Number(e.target.value));
                    resetTimer();
                  }}
                  className="w-full h-2 rounded-full cursor-pointer appearance-none bg-gray-900 focus:outline-none"
                  style={{
                    background: `linear-gradient(90deg, #FF7A00 0%, #FF9F0A ${
                      ((workDuration - 5) / 115) * 100
                    }%, #111827 ${((workDuration - 5) / 115) * 100}%)`,
                  }}
                />
                
                {/* Diagonal Stripe Pattern Overlay (Reflecting Phone design) */}
                <div 
                  className="h-2 rounded-full pointer-events-none absolute top-1.5 left-0 opacity-40 bg-[repeating-linear-gradient(45deg,#00E676,#00E676_4px,transparent_4px,transparent_8px)]"
                  style={{
                    width: `${((workDuration - 5) / 115) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500 leading-tight">
                Recommended: 25 minutes intervals with 5 minutes rest
              </p>
            </div>

            <hr className="border-dashed border-white/5" />

            {/* Link task selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 block">
                Target Activity focus
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full text-xs font-medium px-4 py-3 rounded-xl border border-white/10 bg-gray-950/60 text-white focus:border-accent-mint"
              >
                <option value="">-- No Linked Task --</option>
                {tasks
                  .filter((t) => !t.completed)
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      [{task.priority.toUpperCase()}] {task.title}
                    </option>
                  ))}
              </select>
            </div>

            <hr className="border-dashed border-white/5" />

            {/* Switch Toggles (Premium glowing handles) */}
            <div className="space-y-4">
              
              {/* Switch 1: Do Not Disturb */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Do not Disturb</h4>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                    Silence external alerts when timer is active
                  </p>
                </div>
                {/* Custom sliding switch */}
                <button
                  onClick={() => setDoNotDisturb(!doNotDisturb)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative ${
                    doNotDisturb ? "bg-[#FF7A00]" : "bg-gray-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                      doNotDisturb ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Switch 2: Always On Display */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Always On Display</h4>
                  <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                    Avoid screen locking during timer count
                  </p>
                </div>
                {/* Custom sliding switch */}
                <button
                  onClick={() => setAlwaysOnDisplay(!alwaysOnDisplay)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none relative ${
                    alwaysOnDisplay ? "bg-[#FF7A00]" : "bg-gray-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                      alwaysOnDisplay ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

            </div>

            <hr className="border-dashed border-white/5" />

            {/* Custom footer signature link */}
            <div className="text-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                Tailored with Tomato Core ✦
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
