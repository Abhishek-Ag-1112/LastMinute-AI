import React, { useState } from "react";
import { Habit, Goal } from "../types";
import { Flame, Sparkles, CheckCircle2, Circle, Target, Plus, Trash2, Calendar, AlertCircle } from "lucide-react";

interface HabitsTrackerProps {
  habits: Habit[];
  goals: Goal[];
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (name: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onUpdateHabitNudge: (habitId: string, nudge: string) => void;
  onAddGoal: (text: string, targetDate: string) => void;
  onToggleGoal: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
  apiKey?: string;
}

export default function HabitsTracker({
  habits,
  goals,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onUpdateHabitNudge,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal,
  apiKey,
}: HabitsTrackerProps) {
  const [newHabitName, setNewHabitName] = useState("");
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("2026-06-27");
  const [loadingNudgeId, setLoadingNudgeId] = useState<string | null>(null);

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim());
    setNewHabitName("");
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    onAddGoal(newGoalText.trim(), newGoalDate);
    setNewGoalText("");
  };

  const handleGetNudge = async (habit: Habit) => {
    setLoadingNudgeId(habit.id);
    try {
      const res = await fetch("/api/gemini/habit-nudge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-api-key": apiKey || "",
        },
        body: JSON.stringify({
          habitName: habit.name,
          streak: habit.streak,
        }),
      });

      if (!res.ok) throw new Error("Failed to load custom nudge.");
      const data = await res.json();
      if (data.text) {
        onUpdateHabitNudge(habit.id, data.text);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load AI motivational nudge.");
    } finally {
      setLoadingNudgeId(null);
    }
  };

  // Generate last 7 days representation relative to 2026-06-23
  const getPastSevenDays = () => {
    const days = [];
    const baseDate = new Date("2026-06-23T00:00:00");
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "narrow" });
      days.push({ dateStr, dayName });
    }
    return days;
  };

  const pastSevenDays = getPastSevenDays();
  const todayStr = "2026-06-23";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Habit Forge & Goals</h1>
        <p className="text-xs text-gray-400">Lock in your daily behaviors and build unstoppable streaks with help from Gemini</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* DAILY HABITS LIST (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Daily Habits</h2>
              <form onSubmit={handleAddHabit} className="flex gap-2 w-full max-w-xs">
                <input
                  type="text"
                  placeholder="New habit name..."
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:border-accent-indigo"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-accent-indigo text-black hover:bg-accent-indigo/90 transition text-xs font-semibold cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </form>
            </div>

            {habits.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-880 rounded-xl">
                Create a habit to begin tracking your routines.
              </div>
            ) : (
              <div className="space-y-4">
                {habits.map((habit) => {
                  const isCompletedToday = habit.history.includes(todayStr);

                  return (
                    <div
                      key={habit.id}
                      className="p-4 rounded-xl border border-gray-800 bg-gray-950/40 space-y-3 hover:border-gray-700 transition"
                    >
                      {/* Top info row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onToggleHabit(habit.id)}
                            className="text-gray-400 hover:text-accent-mint transition cursor-pointer"
                          >
                            {isCompletedToday ? (
                              <CheckCircle2 size={20} className="text-accent-mint" />
                            ) : (
                              <Circle size={20} className="hover:text-accent-indigo" />
                            )}
                          </button>
                          <div>
                            <h3 className={`text-xs font-semibold ${isCompletedToday ? "text-gray-500 line-through" : "text-white"}`}>
                              {habit.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-orange-400 font-bold flex items-center gap-0.5">
                                <Flame size={11} className="fill-current animate-pulse" />
                                {habit.streak} day streak
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGetNudge(habit)}
                            disabled={loadingNudgeId === habit.id}
                            className="px-2 py-1 rounded-lg bg-accent-indigo/10 text-accent-indigo border border-accent-indigo/15 text-[10px] font-semibold hover:bg-accent-indigo/20 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles size={10} className={loadingNudgeId === habit.id ? "animate-spin" : ""} />
                            <span>AI Nudge</span>
                          </button>
                          <button
                            onClick={() => onDeleteHabit(habit.id)}
                            className="p-1 text-gray-400 hover:text-accent-red rounded hover:bg-gray-800/60 transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* AI Nudge Block if available */}
                      {habit.nudge && (
                        <div className="p-2.5 rounded-lg bg-accent-indigo/5 border border-accent-indigo/10 text-[11px] text-gray-300 italic flex gap-1.5">
                          <Sparkles size={11} className="text-accent-indigo shrink-0 mt-0.5" />
                          <span>"{habit.nudge}"</span>
                        </div>
                      )}

                      {/* 7-Day Visual Calendar Grid */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-900">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">7-Day History</span>
                        <div className="flex items-center gap-3">
                          {pastSevenDays.map((day) => {
                            const completedOnDay = habit.history.includes(day.dateStr);
                            const isToday = day.dateStr === todayStr;

                            return (
                              <div key={day.dateStr} className="flex flex-col items-center gap-1">
                                <span className={`text-[9px] font-bold ${isToday ? "text-accent-indigo" : "text-gray-500"}`}>
                                  {day.dayName}
                                </span>
                                <div
                                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                                    completedOnDay
                                      ? "bg-accent-mint/20 border-accent-mint text-accent-mint"
                                      : "bg-transparent border-gray-800 text-transparent"
                                  }`}
                                  title={day.dateStr}
                                >
                                  {completedOnDay && <div className="w-1.5 h-1.5 rounded-full bg-accent-mint" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* GOALS SIDEBAR PANEL (1/3 width) */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-accent-indigo">
              <Target size={18} />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Goals</h2>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-3">
              <div>
                <label className="block mb-1 text-[10px] font-medium text-gray-400">Goal Text</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Work out 4 times..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:border-accent-indigo"
                />
              </div>
              <div>
                <label className="block mb-1 text-[10px] font-medium text-gray-400">Target Completion Date</label>
                <div className="relative">
                  <Calendar size={12} className="absolute left-2.5 top-3 text-gray-500" />
                  <input
                    type="date"
                    required
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-accent-indigo"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl text-xs font-semibold text-black bg-accent-indigo hover:bg-accent-indigo/95 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-accent-indigo/10"
              >
                <Plus size={14} />
                <span>Add Goal</span>
              </button>
            </form>

            <div className="space-y-3 pt-3 border-t border-gray-900">
              {goals.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400 border border-dashed border-gray-850 rounded-xl">
                  Set weekly milestones to guide your progress.
                </div>
              ) : (
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-3 rounded-xl border border-gray-850 bg-gray-900/10 flex items-center justify-between gap-2 hover:border-gray-800 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => onToggleGoal(goal.id)}
                          className="text-gray-400 hover:text-accent-mint shrink-0 cursor-pointer"
                        >
                          {goal.completed ? (
                            <CheckCircle2 size={16} className="text-accent-mint" />
                          ) : (
                            <Circle size={16} className="hover:text-accent-indigo" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${goal.completed ? "text-gray-500 line-through" : "text-white"}`}>
                            {goal.text}
                          </p>
                          <span className="text-[9px] text-gray-500 block">
                            Target: {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1 text-gray-400 hover:text-accent-red rounded hover:bg-gray-800/50 transition cursor-pointer shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
