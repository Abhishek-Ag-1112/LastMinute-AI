import React, { useState, useEffect } from "react";
import { Task, DeadlinePrediction } from "../types";
import {
  Plus,
  Sparkles,
  AlertTriangle,
  Mic,
  MicOff,
  Trash2,
  CheckCircle,
  Clock,
  Briefcase,
  User,
  DollarSign,
  Heart,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";

interface DashboardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, "id" | "completed">) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onPrioritizeTasks: (rankedUpdates: Partial<Task>[]) => void;
  apiKey?: string;
}

export default function Dashboard({
  tasks,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onPrioritizeTasks,
  apiKey,
}: DashboardProps) {
  // Task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [category, setCategory] = useState<"Work" | "Personal" | "Finance" | "Health" | "Study">("Work");
  const [duration, setDuration] = useState<number>(30);

  // UI state
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState<DeadlinePrediction | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLog, setVoiceLog] = useState("");
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setVoiceLog("Listening... Speak your task.");
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsRecording(false);
        setVoiceLog("Speech failed. Try again.");
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceLog(`Understood: "${transcript}". Analyzing...`);
        await parseVoiceInput(transcript);
      };

      setRecognition(rec);
    }
  }, []);

  const handleVoiceMicClick = () => {
    if (!recognition) {
      alert("Web Speech API is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const parseVoiceInput = async (transcript: string) => {
    try {
      const res = await fetch("/api/gemini/voice-parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-api-key": apiKey || "",
        },
        body: JSON.stringify({
          transcript,
          currentDate: "2026-06-23T22:26:14-07:00",
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.result) {
        const r = data.result;
        if (r.title) setTitle(r.title);
        if (r.description) setDescription(r.description);
        if (r.deadline_iso) {
          const cleanDeadline = r.deadline_iso.slice(0, 16);
          setDeadline(cleanDeadline);
        }
        if (r.priority) setPriority(r.priority.toLowerCase() as any);
        if (r.category) setCategory(r.category as any);
        if (r.estimated_minutes) setDuration(r.estimated_minutes);
        setVoiceLog(`Imported task: "${r.title || transcript}"`);
      }
    } catch {
      setVoiceLog("Failed to parse voice details. Populating title instead.");
      setTitle(transcript);
    }
  };

  // AI Deadline & Duration Predictor
  const handlePredictDeadline = async () => {
    if (!title) {
      alert("Please enter a task title first so Gemini can analyze complexity.");
      return;
    }
    setIsPredicting(true);
    setPrediction(null);
    try {
      const res = await fetch("/api/gemini/deadline-predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-api-key": apiKey || "",
        },
        body: JSON.stringify({ title, category }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.result) {
        setPrediction(data.result);
        setDuration(Math.round(data.result.estimated_duration_hours * 60));

        const base = new Date("2026-06-23T22:26:14-07:00");
        base.setDate(base.getDate() + (data.result.suggested_lead_days || 1));
        const formattedDate = base.toISOString().slice(0, 16);
        setDeadline(formattedDate);
      }
    } catch {
      alert("Failed to analyze task details with Gemini.");
    } finally {
      setIsPredicting(false);
    }
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    onAddTask({
      title: title.trim(),
      description: description.trim(),
      deadline,
      priority,
      category,
      estimatedDuration: Number(duration),
    });

    setTitle("");
    setDescription("");
    setDeadline("");
    setPriority("medium");
    setCategory("Work");
    setDuration(30);
    setPrediction(null);
    setVoiceLog("");
  };

  // AI Prioritization Trigger
  const handleAiPrioritize = async () => {
    const activeTasks = tasks.filter((t) => !t.completed);
    if (activeTasks.length === 0) {
      alert("No active tasks found to prioritize!");
      return;
    }
    setIsPrioritizing(true);
    try {
      const res = await fetch("/api/gemini/prioritize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-api-key": apiKey || "",
        },
        body: JSON.stringify({
          tasks: activeTasks.map((t) => ({
            id: t.id,
            title: t.title,
            deadline: t.deadline,
            priority: t.priority,
            estimatedDuration: t.estimatedDuration,
            category: t.category,
          })),
          currentTime: "2026-06-23T22:26:14-07:00",
          userEnergy: "morning peak",
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Server returned an error status.");
      }
      const data = await res.json();
      if (data.result) {
        onPrioritizeTasks(data.result);
      }
    } catch (err: any) {
      alert(err.message || "Failed to prioritize tasks with Gemini.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Split tasks relative to current local time
  const getCategorizedTasks = () => {
    const now = new Date("2026-06-23T22:26:14-07:00");
    const todayEnd = new Date("2026-06-23T23:59:59");

    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const upcoming: Task[] = [];
    const completed: Task[] = [];

    tasks.forEach((t) => {
      if (t.completed) {
        completed.push(t);
        return;
      }

      const deadlineDate = new Date(t.deadline);
      if (deadlineDate < now) {
        overdue.push(t);
      } else if (deadlineDate <= todayEnd) {
        dueToday.push(t);
      } else {
        upcoming.push(t);
      }
    });

    return { overdue, dueToday, upcoming, completed };
  };

  const { overdue, dueToday, upcoming, completed } = getCategorizedTasks();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Work":
        return <Briefcase size={12} />;
      case "Personal":
        return <User size={12} />;
      case "Finance":
        return <DollarSign size={12} />;
      case "Health":
        return <Heart size={12} />;
      case "Study":
        return <BookOpen size={12} />;
      default:
        return <Layers size={12} />;
    }
  };

  // Mock data representing the premium chart in Screen 3
  const chartData = [
    { day: "Sun", hours: 2.2, pct: "45%" },
    { day: "Mon", hours: 3.5, pct: "72%" },
    { day: "Tue", hours: 4.8, pct: "95%" },
    { day: "Wed", hours: 3.1, pct: "65%" },
    { day: "Thu", hours: 4.0, pct: "82%" },
    { day: "Fri", hours: 1.5, pct: "32%" },
    { day: "Sat", hours: 2.8, pct: "58%" },
  ];

  return (
    <div className="space-y-8">
      
      {/* 1. HEADER TITLE BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase">Status Summary</h1>
          <p className="text-xs text-gray-400 font-medium">Hello, Riley! Let's begin your focus session</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAiPrioritize}
            disabled={isPrioritizing}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-[#040806] bg-accent-mint hover:scale-[1.02] transition shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles size={13} className={isPrioritizing ? "animate-spin" : ""} />
            <span>AI Auto-Prioritize</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================== */}
        {/* LEFT COLUMN: STATUS & CHARTS (SCREEN 3)                    */}
        {/* ========================================================== */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Dual Glass Stats Cards side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Card 1: Focus duration */}
            <div className="glass-card rounded-3xl p-5 border border-white/5 relative overflow-hidden shadow-xl">
              <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-[#FF7A00] shadow-[0_0_8px_#FF7A00]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Focus duration
              </span>
              <div className="text-2xl font-black text-white mt-1.5 flex items-baseline gap-1">
                <span>3h 16m</span>
              </div>
              <p className="text-[10px] text-accent-mint mt-1 font-bold flex items-center gap-1">
                <span>▲ 12% from target</span>
              </p>
            </div>

            {/* Card 2: Break duration */}
            <div className="glass-card rounded-3xl p-5 border border-white/5 relative overflow-hidden shadow-xl">
              <div className="absolute right-4 top-4 w-2 h-2 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Break duration
              </span>
              <div className="text-2xl font-black text-white mt-1.5 flex items-baseline gap-1">
                <span>0h 28m</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                Standard balance
              </p>
            </div>

          </div>

          {/* Weekly Progress Bar Chart (Screen 3) */}
          <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Your Focus Progress</h3>
                <p className="text-[10px] text-gray-500 font-medium">Recorded minutes compared to target</p>
              </div>
              <span className="text-xs font-black text-[#FF7A00] bg-accent-indigo/10 px-2.5 py-1 rounded-lg">
                Avg: 3.2 hrs/day
              </span>
            </div>

            {/* Bar Chart mapping Sunday to Friday/Saturday */}
            <div className="pt-2">
              <div className="flex items-end justify-between h-40 px-2 relative">
                {/* Visual horizontal guidelines */}
                <div className="absolute left-0 right-0 top-0 border-t border-dashed border-white/5 pointer-events-none" />
                <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-white/5 pointer-events-none" />
                
                {chartData.map((d, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-44 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-950 px-2 py-1 rounded text-[9px] font-bold text-white border border-white/10 shadow-xl">
                      {d.hours} hrs
                    </div>
                    
                    {/* Rounded pill vertical bars with gradient and double glow borders */}
                    <div className="w-6 sm:w-8 bg-gray-900/60 rounded-full h-28 flex items-end overflow-hidden border border-white/5 relative">
                      <div
                        className="w-full bg-gradient-to-t from-[#FF7A00] to-[#FFA800] rounded-full transition-all duration-500 ease-out"
                        style={{ height: d.pct }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#FF7A00] transition-colors">
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Productivity Review Trend Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-[#03150D] to-[#052115] border border-emerald-500/10 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-accent-mint">
                <Award size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Productivity Review</h4>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed font-medium">
                  Your peak efficiency is typically Wednesday morning. Great job!
                </p>
              </div>
            </div>
            <span className="p-1.5 rounded-full bg-white/5 text-gray-400 hover:text-white transition">
              <ArrowRight size={14} />
            </span>
          </div>

        </div>

        {/* ========================================================== */}
        {/* RIGHT COLUMN: ACTIVE DECK & CREATOR                        */}
        {/* ========================================================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Overdue Items list if active */}
          {overdue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent-red font-bold uppercase tracking-wider text-[10px]">
                <AlertTriangle size={12} />
                <span>Overdue Alert ({overdue.length})</span>
              </div>
              <div className="space-y-3">
                {overdue.slice(0, 2).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onDeleteTask={onDeleteTask}
                    icon={getCategoryIcon(task.category)}
                    isOverdue={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Due Today Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-accent-mint font-bold uppercase tracking-wider text-[10px]">
              <Clock size={12} />
              <span>Today's Targets ({dueToday.length})</span>
            </div>
            
            {dueToday.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 border border-dashed border-white/5 rounded-2xl bg-gray-950/20">
                No pressing tasks due today. Complete earlier backlogs!
              </div>
            ) : (
              <div className="space-y-3">
                {dueToday.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onDeleteTask={onDeleteTask}
                    icon={getCategoryIcon(task.category)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Section */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                <Calendar size={12} />
                <span>Next Up Queue ({upcoming.length})</span>
              </div>
              <div className="space-y-3">
                {upcoming.slice(0, 3).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onDeleteTask={onDeleteTask}
                    icon={getCategoryIcon(task.category)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Task Creator Form Side widget */}
          <div className="glass-card rounded-3xl p-6 space-y-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Add Focus Target</h3>
              <button
                type="button"
                onClick={handleVoiceMicClick}
                className={`p-2 rounded-xl cursor-pointer transition ${
                  isRecording
                    ? "bg-accent-red text-white animate-pulse"
                    : "bg-gray-900 text-gray-400 hover:text-white"
                }`}
                title="Scribe with Voice Recognition"
              >
                {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
            </div>

            {voiceLog && (
              <div className="p-2.5 rounded-xl bg-accent-indigo/10 border border-accent-indigo/15 text-[10px] text-gray-300 font-medium leading-relaxed">
                {voiceLog}
              </div>
            )}

            <form onSubmit={handleAddTaskSubmit} className="space-y-3">
              <div>
                <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Task Title</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Design app screen mockup..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs text-white bg-gray-950/60 focus:border-accent-mint"
                  />
                  <button
                    type="button"
                    onClick={handlePredictDeadline}
                    disabled={isPredicting || !title}
                    className="px-2.5 rounded-xl bg-gray-900 border border-white/5 hover:border-accent-mint text-accent-mint flex items-center justify-center transition disabled:opacity-50"
                    title="AI Predict duration"
                  >
                    <Sparkles size={12} className={isPredicting ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {prediction && (
                <div className="p-3 rounded-xl bg-[#090F0C] border border-emerald-500/10 space-y-1">
                  <div className="flex items-center justify-between text-[9px] font-black text-accent-mint uppercase">
                    <span>Gemini Prediction</span>
                    <span>{prediction.complexity}</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed italic">
                    "{prediction.rationale}"
                  </p>
                </div>
              )}

              <div>
                <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-gray-950/60 focus:border-accent-mint"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Finance">Finance</option>
                  <option value="Health">Health</option>
                  <option value="Study">Study</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-gray-950/60 focus:border-accent-mint"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Est. (mins)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-gray-950/60 focus:border-accent-mint font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-gray-950/60 focus:border-accent-mint"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl text-xs font-black text-black bg-[#FF7A00] hover:bg-orange-500 hover:scale-[1.01] transition shadow-lg shadow-orange-950/20 cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus size={13} />
                <span>Create Target Card</span>
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

// SUBCONPONENT TASK CARD (Fully customized with premium glass glow styles)
interface TaskCardProps {
  key?: string;
  task: Task;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  icon: React.ReactNode;
  isOverdue?: boolean;
}

function TaskCard({ task, onToggleComplete, onDeleteTask, icon, isOverdue }: TaskCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const deadlineDate = new Date(task.deadline);
  const formattedDate = deadlineDate.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`glass-card rounded-2xl p-4.5 space-y-3.5 transition-all duration-300 relative overflow-hidden group border border-white/5 shadow-md ${
        isOverdue ? "border-accent-red/20 bg-accent-red/[0.03]" : "hover:border-emerald-500/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3 min-w-0">
          <button
            onClick={() => onToggleComplete(task.id)}
            className="text-gray-400 hover:text-accent-mint mt-0.5 cursor-pointer shrink-0"
          >
            <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center hover:border-accent-mint">
              <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-accent-mint" />
            </div>
          </button>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white group-hover:text-accent-mint transition truncate leading-snug">
              {task.title}
            </h3>
            <span className="text-[10px] text-gray-500 line-clamp-1 font-medium mt-0.5">
              {task.description || "Establish deep focus block"}
            </span>
          </div>
        </div>

        <button
          onClick={() => onDeleteTask(task.id)}
          className="text-gray-500 hover:text-accent-red opacity-0 group-hover:opacity-100 transition duration-150 shrink-0 cursor-pointer"
        >
          <Trash2 size={11} />
        </button>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-gray-400 bg-gray-950/60 border border-white/5 px-2 py-0.5 rounded-md">
            {icon}
            <span>{task.category}</span>
          </span>
          <span
            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
              task.priority === "high"
                ? "bg-accent-red/10 text-accent-red"
                : task.priority === "medium"
                ? "bg-[#FF7A00]/10 text-[#FF7A00]"
                : "bg-gray-800 text-gray-400"
            }`}
          >
            {task.priority}
          </span>
        </div>

        <span className={`text-[10px] font-bold flex items-center gap-1 ${isOverdue ? "text-accent-red animate-pulse" : "text-gray-500"}`}>
          <Clock size={10} />
          <span>{formattedDate}</span>
        </span>
      </div>

      {task.aiPriorityRank && (
        <div className="relative pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
          <span className="text-[#FF7A00] font-bold flex items-center gap-1">
            <Sparkles size={10} />
            <span>AI Prioritized #{task.aiPriorityRank}</span>
          </span>
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-gray-400 hover:text-[#FF7A00] text-[9px] font-bold underline cursor-pointer"
          >
            Details
          </button>

          {showTooltip && (
            <div className="absolute bottom-6 right-0 z-20 w-52 p-3 bg-gray-950 border border-emerald-500/10 text-[10px] text-gray-300 rounded-xl shadow-2xl leading-relaxed">
              {task.aiReason || "Optimized based on urgency constraints and focus performance history."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
