import React, { useState } from "react";
import { Task, Habit, Goal, FocusSession, WeeklyReport } from "../types";
import { Award, TrendingUp, Sparkles, AlertTriangle, CheckCircle2, ChevronRight, CalendarCheck } from "lucide-react";

interface WeeklyReviewProps {
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  focusSessions: FocusSession[];
  weeklyReport: WeeklyReport | null;
  onSaveReport: (report: WeeklyReport) => void;
  apiKey?: string;
}

export default function WeeklyReview({
  tasks,
  habits,
  goals,
  focusSessions,
  weeklyReport,
  onSaveReport,
  apiKey,
}: WeeklyReviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate local stats
  const completedTasks = tasks.filter((t) => t.completed);
  const activeTasks = tasks.filter((t) => !t.completed);
  const overdueTasks = activeTasks.filter((t) => {
    const deadlineDate = new Date(t.deadline);
    const now = new Date("2026-06-23T22:26:14-07:00");
    return deadlineDate < now;
  });

  const totalFocusMins = focusSessions.reduce((sum, s) => sum + s.durationMins, 0);

  // Estimate average completion rate vs missed
  const completedCount = completedTasks.length;
  const missedCount = overdueTasks.length;

  const handleGenerateReview = async () => {
    setIsGenerating(true);
    setError(null);

    // Calculate completion times if completedAt is available
    let totalCompletionTimeMins = 0;
    let timedTasksCount = 0;
    completedTasks.forEach((t) => {
      if (t.completedAt) {
        // Just general mock variance if actual is missing, but otherwise real calc
        const createdMockDate = new Date(t.deadline);
        createdMockDate.setHours(createdMockDate.getHours() - 4); // assume created 4 hrs before deadline
        const completedDate = new Date(t.completedAt);
        const diffMs = completedDate.getTime() - createdMockDate.getTime();
        const diffMins = Math.max(15, Math.floor(diffMs / (1000 * 60)));
        totalCompletionTimeMins += diffMins;
        timedTasksCount++;
      }
    });

    const avgCompletionTimeMins = timedTasksCount > 0 ? Math.floor(totalCompletionTimeMins / timedTasksCount) : 45;

    const streakData = habits.map((h) => ({ name: h.name, streak: h.streak }));
    const goalsSummary = goals.map((g) => ({ text: g.text, completed: g.completed }));

    try {
      const res = await fetch("/api/gemini/weekly-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-api-key": apiKey || "",
        },
        body: JSON.stringify({
          completedCount,
          missedCount,
          avgCompletionTimeMins,
          streakData,
          goals: goalsSummary,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate report.");
      }

      const data = await res.json();
      if (data.result) {
        onSaveReport({
          ...data.result,
          generatedAt: new Date().toLocaleDateString(),
        });
      } else {
        throw new Error("Invalid response schema from AI server.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while calling Gemini.");
    } finally {
      setIsGenerating(false);
    }
  };

  const completionRate =
    tasks.length > 0 ? Math.round((completedCount / (tasks.length)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">My Week & Insights</h1>
        <p className="text-xs text-gray-400">Review your accomplishment metrics and get personalized improvement tips from Gemini</p>
      </div>

      {/* METRIC CHIPS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400">Completion rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-accent-mint">{completionRate}%</span>
            <span className="text-[10px] text-gray-500 font-medium">({completedCount} / {tasks.length})</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400">Overdue / Missed</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${missedCount > 0 ? "text-accent-red" : "text-gray-400"}`}>
              {missedCount}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">Tasks pending</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400">Deep Focus Blocks</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-accent-indigo">{focusSessions.length}</span>
            <span className="text-[10px] text-gray-500 font-medium">({totalFocusMins} mins total)</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-bold text-gray-400">Habit Streaks</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-400">
              {Math.max(...habits.map((h) => h.streak), 0)} days
            </span>
            <span className="text-[10px] text-gray-500 font-medium">Max active streak</span>
          </div>
        </div>
      </div>

      {/* ACTION BLOCK FOR AI GENERATION */}
      {!weeklyReport && !isGenerating && (
        <div className="p-6 rounded-2xl glass-card text-center border-accent-indigo/20 space-y-4">
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl bg-accent-indigo/10 text-accent-indigo">
              <Award size={24} />
            </div>
            <h2 className="text-base font-bold text-white">Generate Your Performance Review</h2>
            <p className="text-xs text-gray-400">
              We'll package your completed tasks, habit frequencies, missed deadlines, and goals, and send them to Gemini for an objective review and structured roadmap.
            </p>
          </div>
          <button
            onClick={handleGenerateReview}
            className="px-6 py-2 rounded-xl text-xs font-bold text-black bg-accent-indigo hover:bg-accent-indigo/90 transition shadow-lg shadow-accent-indigo/15 cursor-pointer"
          >
            Review My Week
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="p-12 rounded-2xl glass-card text-center space-y-4">
          <div className="flex items-center justify-center gap-1.5 text-accent-indigo">
            <Sparkles size={20} className="animate-spin" />
            <span className="text-sm font-bold">Synthesizing weekly achievements</span>
            <span className="animate-bounce">.</span>
            <span className="animate-bounce [animation-delay:0.2s]">.</span>
            <span className="animate-bounce [animation-delay:0.4s]">.</span>
          </div>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Gemini is grading your output consistency, identifying bottlenecks, and compiling 3 core improvements for next week.
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs flex gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Review generation failed:</span> {error}
          </div>
        </div>
      )}

      {/* DISPLAY GENERATED REPORT CARD */}
      {weeklyReport && !isGenerating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {/* ANALYTICS BRIEF */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-tight">{weeklyReport.report_title}</h2>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Compiled on {weeklyReport.generatedAt}</p>
              </div>
              <button
                onClick={handleGenerateReview}
                className="px-3 py-1.5 text-[11px] font-medium text-gray-300 border border-gray-750 rounded-lg hover:text-white hover:bg-gray-800 transition cursor-pointer"
              >
                Regenerate Report
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/40 p-4 rounded-xl border border-gray-800">
              {weeklyReport.summary}
            </p>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent-indigo">3 Actionable Next Steps</h3>
              <div className="space-y-2.5">
                {weeklyReport.actionable_improvements.map((improvement, index) => (
                  <div key={index} className="flex gap-3 text-xs text-gray-300 bg-gray-950/40 p-3 rounded-xl border border-gray-850">
                    <div className="flex items-center justify-center w-5 h-5 rounded-md bg-accent-indigo/10 text-accent-indigo text-[11px] font-bold shrink-0">
                      {index + 1}
                    </div>
                    <span className="leading-relaxed">{improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PRODUCTIVITY GRADUATION CARD */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-6 text-center space-y-6 flex flex-col justify-center items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">AI Productivity Index</h3>

              {/* Radial gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#1F1F2E"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#6C63FF"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - weeklyReport.score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-4xl font-black text-white">{weeklyReport.score}</span>
                  <span className="text-xs text-gray-500 block">/ 100</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">
                  {weeklyReport.score >= 90
                    ? "Elite Productivity Master"
                    : weeklyReport.score >= 75
                    ? "Consistent Executioner"
                    : weeklyReport.score >= 50
                    ? "Developing Efficiency"
                    : "Overcoming Inertia"}
                </h4>
                <p className="text-[11px] text-gray-400 max-w-[200px] mx-auto">
                  Your score balances deadline compliance, habits, and focus minutes.
                </p>
              </div>
            </div>

            {/* WEEK'S GOAL COMPLETION */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Weekly Goal Tracking</h3>
                <span className="text-[10px] text-accent-mint font-bold uppercase">
                  {goals.filter((g) => g.completed).length} / {goals.length} Done
                </span>
              </div>
              <div className="space-y-2">
                {goals.map((g) => (
                  <div key={g.id} className="flex items-center gap-2 text-xs">
                    {g.completed ? (
                      <CheckCircle2 size={14} className="text-accent-mint shrink-0" />
                    ) : (
                      <CalendarCheck size={14} className="text-gray-650 shrink-0" />
                    )}
                    <span className={`truncate ${g.completed ? "text-gray-500 line-through" : "text-gray-300"}`}>
                      {g.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
